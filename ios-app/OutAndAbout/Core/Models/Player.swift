import Foundation
import FirebaseFirestore

struct Player: Codable, Identifiable, Equatable {
    @DocumentID var documentId: String?
    var playerId: String
    var roomId: String
    var displayName: String
    var avatarEmoji: String
    var totalPoints: Int
    var joinedAt: Date
    var isHost: Bool
    var lastSeenAt: Date

    var id: String { playerId }

    enum CodingKeys: String, CodingKey {
        case documentId
        case playerId, roomId, displayName, avatarEmoji
        case totalPoints, joinedAt, isHost, lastSeenAt
    }
}

extension Player {
    static var preview: Player {
        Player(
            playerId: "preview-player-1",
            roomId: "preview-room-123",
            displayName: "Alex",
            avatarEmoji: "🎯",
            totalPoints: 150,
            joinedAt: Date().addingTimeInterval(-300),
            isHost: true,
            lastSeenAt: Date()
        )
    }

    static var previewOther: Player {
        Player(
            playerId: "preview-player-2",
            roomId: "preview-room-123",
            displayName: "Jordan",
            avatarEmoji: "🔥",
            totalPoints: 90,
            joinedAt: Date().addingTimeInterval(-280),
            isHost: false,
            lastSeenAt: Date()
        )
    }

    static var previewPlayers: [Player] {
        [
            preview,
            previewOther,
            Player(playerId: "p3", roomId: "preview-room-123", displayName: "Sam", avatarEmoji: "⚡", totalPoints: 200, joinedAt: Date(), isHost: false, lastSeenAt: Date()),
            Player(playerId: "p4", roomId: "preview-room-123", displayName: "Casey", avatarEmoji: "🌟", totalPoints: 75, joinedAt: Date(), isHost: false, lastSeenAt: Date()),
        ]
    }
}
