import Foundation
import FirebaseFirestore

struct DareSubmission: Identifiable, Equatable {
    @DocumentID var documentId: String?
    var submissionId: String
    var roomId: String
    var playerId: String
    var dareId: String
    var dareTextSnapshot: String
    var pointsAwarded: Int
    var pointsPotential: Int
    var mediaType: MediaType
    var mediaUrl: String
    var thumbnailUrl: String
    var createdAt: Date
    var renderEligible: Bool
    var verificationStatus: VerificationStatus
    var verificationReason: String?
    var verificationSource: VerificationSource?
    var verifiedAt: Date?
    var duplicateOfSubmissionId: String?

    var id: String { submissionId }
    var isPhoto: Bool { mediaType == .image }
    var isVideo: Bool { mediaType == .video }
    var isTerminal: Bool { verificationStatus == .approved || verificationStatus == .rejected }
}

extension DareSubmission: Codable {
    enum CodingKeys: String, CodingKey {
        case documentId
        case submissionId, roomId, playerId, dareId
        case dareTextSnapshot, pointsAwarded, pointsPotential, mediaType
        case mediaUrl, thumbnailUrl, createdAt, renderEligible
        case verificationStatus, verificationReason, verificationSource
        case verifiedAt, duplicateOfSubmissionId
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        documentId = try c.decodeIfPresent(String.self, forKey: .documentId)
        submissionId = try c.decode(String.self, forKey: .submissionId)
        roomId = try c.decode(String.self, forKey: .roomId)
        playerId = try c.decode(String.self, forKey: .playerId)
        dareId = try c.decode(String.self, forKey: .dareId)
        dareTextSnapshot = try c.decode(String.self, forKey: .dareTextSnapshot)
        pointsAwarded = try c.decode(Int.self, forKey: .pointsAwarded)
        pointsPotential = (try? c.decode(Int.self, forKey: .pointsPotential)) ?? pointsAwarded
        // "photo" is the legacy value; normalize to .image
        let rawMediaType = try c.decode(String.self, forKey: .mediaType)
        mediaType = rawMediaType == "photo" ? .image : (MediaType(rawValue: rawMediaType) ?? .image)
        mediaUrl = try c.decode(String.self, forKey: .mediaUrl)
        thumbnailUrl = try c.decode(String.self, forKey: .thumbnailUrl)
        createdAt = try c.decode(Date.self, forKey: .createdAt)
        renderEligible = (try? c.decode(Bool.self, forKey: .renderEligible)) ?? true
        // Old documents without verificationStatus are treated as approved
        verificationStatus = (try? c.decode(VerificationStatus.self, forKey: .verificationStatus)) ?? .approved
        verificationReason = try? c.decode(String.self, forKey: .verificationReason)
        verificationSource = try? c.decode(VerificationSource.self, forKey: .verificationSource)
        verifiedAt = try? c.decode(Date.self, forKey: .verifiedAt)
        duplicateOfSubmissionId = try? c.decode(String.self, forKey: .duplicateOfSubmissionId)
    }
}

enum MediaType: String, Codable {
    case image
    case video
}

enum VerificationStatus: String, Codable {
    case pending
    case approved
    case rejected
    case needsReview = "needs_review"
}

enum VerificationSource: String, Codable {
    case ruleEngine = "rule_engine"
    case ai
    case admin
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
            pointsPotential: 20,
            mediaType: .image,
            mediaUrl: "https://picsum.photos/400/600",
            thumbnailUrl: "https://picsum.photos/400/600",
            createdAt: Date().addingTimeInterval(-120),
            renderEligible: true,
            verificationStatus: .approved
        )
    }

    static var previewPending: DareSubmission {
        DareSubmission(
            submissionId: "sub-003",
            roomId: "preview-room-123",
            playerId: "preview-player-1",
            dareId: "dare_003",
            dareTextSnapshot: "Recreate a famous painting pose using your surroundings",
            pointsAwarded: 0,
            pointsPotential: 80,
            mediaType: .image,
            mediaUrl: "https://picsum.photos/400/600",
            thumbnailUrl: "https://picsum.photos/400/600",
            createdAt: Date().addingTimeInterval(-30),
            renderEligible: false,
            verificationStatus: .needsReview,
            verificationReason: "Admin review required"
        )
    }
}
