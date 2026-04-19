import Foundation
import FirebaseFirestore

protocol ReelRepositoryProtocol {
    func listenToPlayerReelJob(roomId: String, playerId: String) -> AsyncStream<ReelJob?>
    func listenToGroupReelJob(roomId: String) -> AsyncStream<ReelJob?>
    func getAllReelJobs(roomId: String) async throws -> [ReelJob]
}

final class ReelRepository: ReelRepositoryProtocol {
    private let firestore = FirestoreService.shared

    func listenToPlayerReelJob(roomId: String, playerId: String) -> AsyncStream<ReelJob?> {
        AsyncStream { continuation in
            let query = self.firestore.db
                .collection("reelJobs")
                .whereField("roomId", isEqualTo: roomId)
                .whereField("playerId", isEqualTo: playerId)
                .whereField("type", isEqualTo: "personal")
                .limit(to: 1)

            let listener = query.addSnapshotListener { snapshot, error in
                if let error {
                    print("[ReelRepository] Listener error: \(error)")
                    continuation.yield(nil)
                    return
                }
                let job = snapshot?.documents.first.flatMap { try? $0.data(as: ReelJob.self) }
                continuation.yield(job)
            }
            continuation.onTermination = { _ in listener.remove() }
        }
    }

    func listenToGroupReelJob(roomId: String) -> AsyncStream<ReelJob?> {
        AsyncStream { continuation in
            let query = self.firestore.db
                .collection("reelJobs")
                .whereField("roomId", isEqualTo: roomId)
                .whereField("type", isEqualTo: "group")
                .limit(to: 1)

            let listener = query.addSnapshotListener { snapshot, error in
                if let error {
                    print("[ReelRepository] Group listener error: \(error)")
                    continuation.yield(nil)
                    return
                }
                let job = snapshot?.documents.first.flatMap { try? $0.data(as: ReelJob.self) }
                continuation.yield(job)
            }
            continuation.onTermination = { _ in listener.remove() }
        }
    }

    func getAllReelJobs(roomId: String) async throws -> [ReelJob] {
        let snap = try await firestore.db
            .collection("reelJobs")
            .whereField("roomId", isEqualTo: roomId)
            .getDocuments()
        return try snap.documents.map { try $0.data(as: ReelJob.self) }
    }
}
