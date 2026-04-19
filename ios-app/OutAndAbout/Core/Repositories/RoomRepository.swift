import Foundation
import FirebaseFirestore
import FirebaseFunctions

protocol RoomRepositoryProtocol {
    func createRoom(displayName: String, avatarEmoji: String, timerMinutes: Int) async throws -> (Room, Player)
    func joinRoom(inviteCode: String, displayName: String, avatarEmoji: String) async throws -> (Room, Player)
    func startGame(roomId: String, timerMinutes: Int) async throws
    func listenToRoom(roomId: String) -> AsyncStream<Room?>
    func getRoom(roomId: String) async throws -> Room
}

final class RoomRepository: RoomRepositoryProtocol {
    private let firestore = FirestoreService.shared
    private let functions = Functions.functions()
    private let auth = AuthService.shared

    func createRoom(displayName: String, avatarEmoji: String, timerMinutes: Int) async throws -> (Room, Player) {
        let callable = functions.httpsCallable("createRoom")
        let result = try await callable.call([
            "displayName": displayName,
            "avatarEmoji": avatarEmoji,
            "timerMinutes": timerMinutes,
        ])

        guard let data = result.data as? [String: Any],
              let roomId = data["roomId"] as? String,
              let inviteCode = data["inviteCode"] as? String,
              let playerId = data["playerId"] as? String else {
            throw RepositoryError.invalidResponse
        }

        // Fetch the created room and player
        let room: Room = try await firestore.getDocument(
            firestore.db.collection("rooms").document(roomId)
        )
        let player = Player(
            playerId: playerId,
            roomId: roomId,
            displayName: displayName,
            avatarEmoji: avatarEmoji,
            totalPoints: 0,
            joinedAt: Date(),
            isHost: true,
            lastSeenAt: Date()
        )
        _ = inviteCode
        return (room, player)
    }

    func joinRoom(inviteCode: String, displayName: String, avatarEmoji: String) async throws -> (Room, Player) {
        let callable = functions.httpsCallable("joinRoom")
        let result = try await callable.call([
            "inviteCode": inviteCode,
            "displayName": displayName,
            "avatarEmoji": avatarEmoji,
        ])

        guard let data = result.data as? [String: Any],
              let roomId = data["roomId"] as? String,
              let playerId = data["playerId"] as? String else {
            throw RepositoryError.invalidResponse
        }

        let room: Room = try await firestore.getDocument(
            firestore.db.collection("rooms").document(roomId)
        )
        let playerSnap = try await firestore.db
            .collection("rooms").document(roomId)
            .collection("players").document(playerId)
            .getDocument()
        let player = try playerSnap.data(as: Player.self)

        return (room, player)
    }

    func startGame(roomId: String, timerMinutes: Int) async throws {
        let callable = functions.httpsCallable("startGame")
        _ = try await callable.call(["roomId": roomId, "timerMinutes": timerMinutes])
    }

    func listenToRoom(roomId: String) -> AsyncStream<Room?> {
        let ref = firestore.db.collection("rooms").document(roomId)
        return firestore.listenToDocument(ref)
    }

    func getRoom(roomId: String) async throws -> Room {
        try await firestore.getDocument(
            firestore.db.collection("rooms").document(roomId)
        )
    }
}

enum RepositoryError: LocalizedError {
    case invalidResponse
    case notFound
    case unauthorized

    var errorDescription: String? {
        switch self {
        case .invalidResponse: return "Invalid server response."
        case .notFound: return "Not found."
        case .unauthorized: return "You are not authorized to perform this action."
        }
    }
}
