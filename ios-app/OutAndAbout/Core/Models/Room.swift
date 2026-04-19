import Foundation
import FirebaseFirestore

struct Room: Codable, Identifiable, Equatable {
    @DocumentID var documentId: String?
    var roomId: String
    var hostPlayerId: String
    var createdAt: Date
    var status: RoomStatus
    var timerMinutes: Int
    var startedAt: Date?
    var endsAt: Date?
    var currentPlayerCount: Int
    var dareDeckVersion: String
    var personalReelsReadyCount: Int
    var groupReelReady: Bool
    var inviteCode: String

    var id: String { roomId }

    enum CodingKeys: String, CodingKey {
        case documentId
        case roomId, hostPlayerId, createdAt, status
        case timerMinutes, startedAt, endsAt
        case currentPlayerCount, dareDeckVersion
        case personalReelsReadyCount, groupReelReady, inviteCode
    }
}

enum RoomStatus: String, Codable, Equatable {
    case lobby
    case live
    case ended
    case rendering
}

extension Room {
    var isLive: Bool { status == .live }
    var isEnded: Bool { status == .ended || status == .rendering }
    var isLobby: Bool { status == .lobby }
    var isFull: Bool { currentPlayerCount >= 20 }
    var playerCountDisplay: String { "\(currentPlayerCount)/20" }
}

extension Room {
    static var preview: Room {
        Room(
            roomId: "preview-room-123",
            hostPlayerId: "host-uid",
            createdAt: Date(),
            status: .lobby,
            timerMinutes: 30,
            currentPlayerCount: 3,
            dareDeckVersion: "v1",
            personalReelsReadyCount: 0,
            groupReelReady: false,
            inviteCode: "ABC123"
        )
    }

    static var previewLive: Room {
        var room = preview
        room.status = .live
        room.startedAt = Date().addingTimeInterval(-120)
        room.endsAt = Date().addingTimeInterval(1680)
        return room
    }
}
