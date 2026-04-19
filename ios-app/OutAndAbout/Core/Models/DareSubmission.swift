import Foundation
import FirebaseFirestore

struct DareSubmission: Codable, Identifiable, Equatable {
    @DocumentID var documentId: String?
    var submissionId: String
    var roomId: String
    var playerId: String
    var dareId: String
    var dareTextSnapshot: String
    var pointsAwarded: Int
    var mediaType: MediaType
    var mediaUrl: String
    var thumbnailUrl: String
    var createdAt: Date
    var renderEligible: Bool

    var id: String { submissionId }

    var isPhoto: Bool { mediaType == .photo }
    var isVideo: Bool { mediaType == .video }

    enum CodingKeys: String, CodingKey {
        case documentId
        case submissionId, roomId, playerId, dareId
        case dareTextSnapshot, pointsAwarded, mediaType
        case mediaUrl, thumbnailUrl, createdAt, renderEligible
    }
}

enum MediaType: String, Codable {
    case photo
    case video
}

extension DareSubmission {
    static var preview: DareSubmission {
        DareSubmission(
            submissionId: "sub-001",
            roomId: "preview-room-123",
            playerId: "preview-player-1",
            dareId: "dare_001",
            dareTextSnapshot: "Get a complete stranger to high-five you",
            pointsAwarded: 20,
            mediaType: .photo,
            mediaUrl: "https://picsum.photos/400/600",
            thumbnailUrl: "https://picsum.photos/400/600",
            createdAt: Date().addingTimeInterval(-120),
            renderEligible: true
        )
    }

    static var previewVideo: DareSubmission {
        DareSubmission(
            submissionId: "sub-002",
            roomId: "preview-room-123",
            playerId: "preview-player-1",
            dareId: "dare_002",
            dareTextSnapshot: "Do 10 jumping jacks in a public place",
            pointsAwarded: 30,
            mediaType: .video,
            mediaUrl: "https://example.com/video.mp4",
            thumbnailUrl: "https://picsum.photos/400/600",
            createdAt: Date().addingTimeInterval(-60),
            renderEligible: true
        )
    }
}
