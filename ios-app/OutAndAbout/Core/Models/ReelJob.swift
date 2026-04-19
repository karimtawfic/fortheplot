import Foundation
import FirebaseFirestore

struct ReelJob: Codable, Identifiable, Equatable {
    @DocumentID var documentId: String?
    var jobId: String
    var roomId: String
    var playerId: String?
    var type: ReelJobType
    var status: ReelJobStatus
    var outputUrl: String?
    var createdAt: Date
    var updatedAt: Date
    var errorMessage: String?

    var id: String { jobId }

    var isComplete: Bool { status == .complete }
    var isFailed: Bool { status == .failed }
    var isProcessing: Bool { status == .processing || status == .queued }

    enum CodingKeys: String, CodingKey {
        case documentId
        case jobId, roomId, playerId, type, status
        case outputUrl, createdAt, updatedAt, errorMessage
    }
}

enum ReelJobType: String, Codable {
    case personal
    case group
}

enum ReelJobStatus: String, Codable {
    case queued
    case processing
    case complete
    case failed
}

extension ReelJob {
    static var previewProcessing: ReelJob {
        ReelJob(
            jobId: "job-001",
            roomId: "preview-room-123",
            playerId: "preview-player-1",
            type: .personal,
            status: .processing,
            createdAt: Date().addingTimeInterval(-30),
            updatedAt: Date()
        )
    }

    static var previewComplete: ReelJob {
        ReelJob(
            jobId: "job-002",
            roomId: "preview-room-123",
            playerId: "preview-player-1",
            type: .personal,
            status: .complete,
            outputUrl: "https://example.com/reel.mp4",
            createdAt: Date().addingTimeInterval(-120),
            updatedAt: Date()
        )
    }
}
