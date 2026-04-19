import Foundation
import FirebaseFirestore

protocol PlayerRepositoryProtocol {
    func listenToPlayers(roomId: String) -> AsyncStream<[Player]>
    func getPlayer(roomId: String, playerId: String) async throws -> Player?
    func updateLastSeen(roomId: String, playerId: String) async throws
    func updateAvatar(roomId: String, playerId: String, avatarEmoji: String) async throws
}

final class PlayerRepository: PlayerRepositoryProtocol {
    private let firestore = FirestoreService.shared

    func listenToPlayers(roomId: String) -> AsyncStream<[Player]> {
        let query = firestore.db
            .collection("rooms").document(roomId)
            .collection("players")
            .order(by: "totalPoints", descending: true)
        return firestore.listenToCollection(query)
    }

    func getPlayer(roomId: String, playerId: String) async throws -> Player? {
        let snap = try await firestore.db
            .collection("rooms").document(roomId)
            .collection("players").document(playerId)
            .getDocument()
        guard snap.exists else { return nil }
        return try snap.data(as: Player.self)
    }

    func updateLastSeen(roomId: String, playerId: String) async throws {
        let ref = firestore.db
            .collection("rooms").document(roomId)
            .collection("players").document(playerId)
        try await ref.updateData(["lastSeenAt": FieldValue.serverTimestamp()])
    }

    func updateAvatar(roomId: String, playerId: String, avatarEmoji: String) async throws {
        let ref = firestore.db
            .collection("rooms").document(roomId)
            .collection("players").document(playerId)
        try await ref.updateData(["avatarEmoji": avatarEmoji])
    }
}
