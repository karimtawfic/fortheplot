import Foundation
import FirebaseStorage

final class StorageService {
    static let shared = StorageService()
    private init() {}

    private let storage = Storage.storage()

    func uploadMedia(
        data: Data,
        path: String,
        contentType: String,
        onProgress: @escaping @Sendable (Double) -> Void
    ) async throws -> String {
        let ref = storage.reference().child(path)
        let metadata = StorageMetadata()
        metadata.contentType = contentType

        return try await withCheckedThrowingContinuation { continuation in
            let task = ref.putData(data, metadata: metadata)

            task.observe(.progress) { snapshot in
                let total = snapshot.progress?.totalUnitCount ?? 1
                let completed = snapshot.progress?.completedUnitCount ?? 0
                let fraction = total > 0 ? Double(completed) / Double(total) : 0
                onProgress(fraction)
            }

            task.observe(.success) { _ in
                ref.downloadURL { url, error in
                    if let url {
                        continuation.resume(returning: url.absoluteString)
                    } else {
                        continuation.resume(throwing: error ?? StorageServiceError.urlFetchFailed)
                    }
                }
            }

            task.observe(.failure) { snapshot in
                continuation.resume(throwing: snapshot.error ?? StorageServiceError.uploadFailed)
            }
        }
    }

    func deleteFile(at path: String) async throws {
        let ref = storage.reference().child(path)
        try await ref.delete()
    }
}

enum StorageServiceError: LocalizedError {
    case uploadFailed
    case urlFetchFailed
    case compressionFailed

    var errorDescription: String? {
        switch self {
        case .uploadFailed: return "Media upload failed. Please try again."
        case .urlFetchFailed: return "Could not retrieve the upload URL."
        case .compressionFailed: return "Media compression failed."
        }
    }
}
