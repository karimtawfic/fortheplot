import SwiftUI
import PhotosUI
import AVFoundation
import UIKit

enum ProofUploadState {
    case idle
    case compressing
    case uploading(progress: Double)
    case submitting
    case success(pointsAwarded: Int)
    case failure(String)
}

@MainActor
final class ProofUploadViewModel: ObservableObject {
    @Published var selectedPhotoItem: PhotosPickerItem?
    @Published var selectedImage: UIImage?
    @Published var selectedVideoURL: URL?
    @Published var videoThumbnail: UIImage?
    @Published var uploadState: ProofUploadState = .idle
    @Published var mediaType: MediaType = .photo
    @Published var showCamera = false

    private let storageService = StorageService.shared
    private let submissionRepo = SubmissionRepository()

    var hasMedia: Bool { selectedImage != nil || selectedVideoURL != nil }

    var uploadProgress: Double {
        if case .uploading(let p) = uploadState { return p }
        return 0
    }

    var isProcessing: Bool {
        switch uploadState {
        case .compressing, .uploading, .submitting: return true
        default: return false
        }
    }

    // MARK: - Photo Selection

    func processSelectedPhoto() async {
        guard let item = selectedPhotoItem else { return }
        uploadState = .compressing
        do {
            if let data = try await item.loadTransferable(type: Data.self),
               let image = UIImage(data: data) {
                selectedImage = image
                selectedVideoURL = nil
                videoThumbnail = nil
                mediaType = .photo
            }
        } catch {
            uploadState = .failure("Failed to load image: \(error.localizedDescription)")
            return
        }
        uploadState = .idle
    }

    // MARK: - Video Selection

    func processSelectedVideo(item: PhotosPickerItem) async {
        uploadState = .compressing
        do {
            if let url = try await item.loadTransferable(type: URL.self) {
                await setVideo(url: url)
            } else if let data = try await item.loadTransferable(type: Data.self) {
                let tmpURL = FileManager.default.temporaryDirectory
                    .appendingPathComponent(UUID().uuidString)
                    .appendingPathExtension("mp4")
                try data.write(to: tmpURL)
                await setVideo(url: tmpURL)
            }
        } catch {
            uploadState = .failure("Failed to load video: \(error.localizedDescription)")
        }
    }

    func setVideo(url: URL) async {
        mediaType = .video
        // Compress video
        if let compressedURL = await compressVideo(url: url) {
            selectedVideoURL = compressedURL
        } else {
            selectedVideoURL = url
        }
        // Generate thumbnail
        videoThumbnail = await generateThumbnail(url: selectedVideoURL ?? url)
        selectedImage = nil
        uploadState = .idle
    }

    func setPhoto(image: UIImage) {
        selectedImage = image
        selectedVideoURL = nil
        videoThumbnail = nil
        mediaType = .photo
        uploadState = .idle
    }

    // MARK: - Submit

    func submit(dare: Dare, roomId: String, playerId: String) async {
        guard hasMedia else { return }

        do {
            // Compress and upload
            let (mediaUrl, thumbnailUrl) = try await uploadMedia(dare: dare, roomId: roomId, playerId: playerId)

            // Call submitDare Cloud Function
            uploadState = .submitting
            let submission = try await submissionRepo.submit(
                dare: dare,
                roomId: roomId,
                mediaType: mediaType,
                mediaUrl: mediaUrl,
                thumbnailUrl: thumbnailUrl
            )

            UINotificationFeedbackGenerator().notificationOccurred(.success)
            uploadState = .success(pointsAwarded: submission.pointsAwarded)

        } catch {
            uploadState = .failure(error.localizedDescription)
            UINotificationFeedbackGenerator().notificationOccurred(.error)
        }
    }

    private func uploadMedia(dare: Dare, roomId: String, playerId: String) async throws -> (mediaUrl: String, thumbnailUrl: String) {
        let uuid = UUID().uuidString
        var mediaUrl = ""
        var thumbnailUrl = ""

        if mediaType == .photo, let image = selectedImage {
            guard let data = image.jpegData(compressionQuality: 0.8) else {
                throw StorageServiceError.compressionFailed
            }
            let path = "submissions/\(roomId)/\(playerId)/\(uuid).jpg"
            uploadState = .uploading(progress: 0)
            mediaUrl = try await storageService.uploadMedia(data: data, path: path, contentType: "image/jpeg") { [weak self] progress in
                Task { @MainActor in
                    self?.uploadState = .uploading(progress: progress)
                }
            }
            thumbnailUrl = mediaUrl

        } else if mediaType == .video, let videoURL = selectedVideoURL {
            let videoData = try Data(contentsOf: videoURL)
            let path = "submissions/\(roomId)/\(playerId)/\(uuid).mp4"
            uploadState = .uploading(progress: 0)
            mediaUrl = try await storageService.uploadMedia(data: videoData, path: path, contentType: "video/mp4") { [weak self] progress in
                Task { @MainActor in
                    self?.uploadState = .uploading(progress: progress * 0.9) // reserve 10% for thumbnail
                }
            }

            // Upload thumbnail
            if let thumb = videoThumbnail, let thumbData = thumb.jpegData(compressionQuality: 0.7) {
                let thumbPath = "thumbnails/\(roomId)/\(playerId)/\(uuid)_thumb.jpg"
                thumbnailUrl = try await storageService.uploadMedia(data: thumbData, path: thumbPath, contentType: "image/jpeg") { [weak self] progress in
                    Task { @MainActor in
                        self?.uploadState = .uploading(progress: 0.9 + progress * 0.1)
                    }
                }
            } else {
                thumbnailUrl = mediaUrl
            }
        }

        return (mediaUrl, thumbnailUrl)
    }

    // MARK: - Media Helpers

    private func compressVideo(url: URL) async -> URL? {
        await withCheckedContinuation { continuation in
            let asset = AVURLAsset(url: url)
            guard let exportSession = AVAssetExportSession(
                asset: asset,
                presetName: AVAssetExportPresetMediumQuality
            ) else {
                continuation.resume(returning: nil)
                return
            }
            let outputURL = FileManager.default.temporaryDirectory
                .appendingPathComponent(UUID().uuidString)
                .appendingPathExtension("mp4")
            exportSession.outputURL = outputURL
            exportSession.outputFileType = .mp4
            exportSession.exportAsynchronously {
                if exportSession.status == .completed {
                    continuation.resume(returning: outputURL)
                } else {
                    continuation.resume(returning: nil)
                }
            }
        }
    }

    private func generateThumbnail(url: URL) async -> UIImage? {
        await withCheckedContinuation { continuation in
            let asset = AVURLAsset(url: url)
            let generator = AVAssetImageGenerator(asset: asset)
            generator.appliesPreferredTrackTransform = true
            generator.maximumSize = CGSize(width: 400, height: 600)
            let time = CMTime(seconds: 0.5, preferredTimescale: 600)
            generator.generateCGImagesAsynchronously(forTimes: [NSValue(time: time)]) { _, cgImage, _, result, _ in
                if result == .succeeded, let cgImage {
                    continuation.resume(returning: UIImage(cgImage: cgImage))
                } else {
                    continuation.resume(returning: nil)
                }
            }
        }
    }
}
