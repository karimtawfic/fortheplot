import SwiftUI
import PhotosUI
import AVFoundation
import UIKit

enum ProofUploadState {
    case idle
    case compressing
    case uploading(progress: Double)
    case submitting
    case success(pointsAwarded: Int, verificationStatus: VerificationStatus)
    case failure(String)
}

@MainActor
final class ProofUploadViewModel: ObservableObject {
    @Published var selectedPhotoItem: PhotosPickerItem?
    @Published var selectedImage: UIImage?
    @Published var selectedVideoURL: URL?
    @Published var videoThumbnail: UIImage?
    @Published var uploadState: ProofUploadState = .idle
    @Published var mediaType: MediaType = .image
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
                mediaType = .image
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
        if let compressedURL = await compressVideo(url: url) {
            selectedVideoURL = compressedURL
        } else {
            selectedVideoURL = url
        }
        videoThumbnail = await generateThumbnail(url: selectedVideoURL ?? url)
        selectedImage = nil
        uploadState = .idle
    }

    func setPhoto(image: UIImage) {
        selectedImage = image
        selectedVideoURL = nil
        videoThumbnail = nil
        mediaType = .image
        uploadState = .idle
    }

    // MARK: - Submit

    func submit(dare: Dare, roomId: String, playerId: String) async {
        guard hasMedia else { return }

        do {
            // Generate submissionId before upload so it can be embedded in the Storage path
            let submissionId = UUID().uuidString.lowercased()
            let (mediaUrl, thumbnailUrl, fileSizeBytes) = try await uploadMedia(
                dare: dare,
                roomId: roomId,
                playerId: playerId,
                submissionId: submissionId
            )

            uploadState = .submitting
            let result = try await submissionRepo.submit(
                submissionId: submissionId,
                dare: dare,
                roomId: roomId,
                mediaType: mediaType,
                mediaUrl: mediaUrl,
                thumbnailUrl: thumbnailUrl,
                metadata: ["fileSizeBytes": fileSizeBytes, "mimeType": mediaType == .image ? "image/jpeg" : "video/mp4"]
            )

            UINotificationFeedbackGenerator().notificationOccurred(.success)
            uploadState = .success(pointsAwarded: result.pointsAwarded, verificationStatus: result.verificationStatus)

        } catch {
            uploadState = .failure(error.localizedDescription)
            UINotificationFeedbackGenerator().notificationOccurred(.error)
        }
    }

    private func uploadMedia(
        dare: Dare,
        roomId: String,
        playerId: String,
        submissionId: String
    ) async throws -> (mediaUrl: String, thumbnailUrl: String, fileSizeBytes: Int) {
        let basePath = "rooms/\(roomId)/players/\(playerId)/submissions/\(submissionId)"
        var mediaUrl = ""
        var thumbnailUrl = ""
        var fileSizeBytes = 0

        if mediaType == .image, let image = selectedImage {
            guard let data = image.jpegData(compressionQuality: 0.8) else {
                throw StorageServiceError.compressionFailed
            }
            fileSizeBytes = data.count
            let path = "\(basePath)/original.jpg"
            uploadState = .uploading(progress: 0)
            mediaUrl = try await storageService.uploadMedia(data: data, path: path, contentType: "image/jpeg") { [weak self] progress in
                Task { @MainActor in self?.uploadState = .uploading(progress: progress) }
            }
            thumbnailUrl = mediaUrl

        } else if mediaType == .video, let videoURL = selectedVideoURL {
            let videoData = try Data(contentsOf: videoURL)
            fileSizeBytes = videoData.count
            let path = "\(basePath)/original.mp4"
            uploadState = .uploading(progress: 0)
            mediaUrl = try await storageService.uploadMedia(data: videoData, path: path, contentType: "video/mp4") { [weak self] progress in
                Task { @MainActor in self?.uploadState = .uploading(progress: progress * 0.9) }
            }

            if let thumb = videoThumbnail, let thumbData = thumb.jpegData(compressionQuality: 0.7) {
                let thumbPath = "\(basePath)/thumb.jpg"
                thumbnailUrl = try await storageService.uploadMedia(data: thumbData, path: thumbPath, contentType: "image/jpeg") { [weak self] progress in
                    Task { @MainActor in self?.uploadState = .uploading(progress: 0.9 + progress * 0.1) }
                }
            } else {
                thumbnailUrl = mediaUrl
            }
        }

        return (mediaUrl, thumbnailUrl, fileSizeBytes)
    }

    // MARK: - Media Helpers

    private func compressVideo(url: URL) async -> URL? {
        await withCheckedContinuation { continuation in
            let asset = AVURLAsset(url: url)
            guard let exportSession = AVAssetExportSession(asset: asset, presetName: AVAssetExportPresetMediumQuality) else {
                continuation.resume(returning: nil); return
            }
            let outputURL = FileManager.default.temporaryDirectory
                .appendingPathComponent(UUID().uuidString).appendingPathExtension("mp4")
            exportSession.outputURL = outputURL
            exportSession.outputFileType = .mp4
            exportSession.exportAsynchronously {
                continuation.resume(returning: exportSession.status == .completed ? outputURL : nil)
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
                continuation.resume(returning: (result == .succeeded && cgImage != nil) ? UIImage(cgImage: cgImage!) : nil)
            }
        }
    }
}
