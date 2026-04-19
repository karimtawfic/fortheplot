import Foundation
import FirebaseFirestore
import FirebaseFunctions

protocol SubmissionRepositoryProtocol {
    func submit(
        dare: Dare,
        roomId: String,
        mediaType: MediaType,
        mediaUrl: String,
        thumbnailUrl: String
    ) async throws -> DareSubmission

    func listenToAllSubmissions(roomId: String) -> AsyncStream<[DareSubmission]>
    func listenToPlayerSubmissions(roomId: String, playerId: String) -> AsyncStream<[DareSubmission]>
    func hasSubmitted(roomId: String, playerId: String, dareId: String) async throws -> Bool
}

final class SubmissionRepository: SubmissionRepositoryProtocol {
    private let firestore = FirestoreService.shared
    private let functions = Functions.functions()

    func submit(
        dare: Dare,
        roomId: String,
        mediaType: MediaType,
        mediaUrl: String,
        thumbnailUrl: String
    ) async throws -> DareSubmission {
        let callable = functions.httpsCallable("submitDare")
        let result = try await callable.call([
            "roomId": roomId,
            "dareId": dare.dareId,
            "mediaType": mediaType.rawValue,
            "mediaUrl": mediaUrl,
            "thumbnailUrl": thumbnailUrl,
        ])

        guard let data = result.data as? [String: Any],
              let submissionId = data["submissionId"] as? String,
              let pointsAwarded = data["pointsAwarded"] as? Int else {
            throw RepositoryError.invalidResponse
        }

        return DareSubmission(
            submissionId: submissionId,
            roomId: roomId,
            playerId: AuthService.shared.currentUID ?? "",
            dareId: dare.dareId,
            dareTextSnapshot: dare.text,
            pointsAwarded: pointsAwarded,
            mediaType: mediaType,
            mediaUrl: mediaUrl,
            thumbnailUrl: thumbnailUrl,
            createdAt: Date(),
            renderEligible: true
        )
    }

    func listenToAllSubmissions(roomId: String) -> AsyncStream<[DareSubmission]> {
        let query = firestore.db
            .collection("rooms").document(roomId)
            .collection("submissions")
            .order(by: "createdAt", descending: true)
        return firestore.listenToCollection(query)
    }

    func listenToPlayerSubmissions(roomId: String, playerId: String) -> AsyncStream<[DareSubmission]> {
        let query = firestore.db
            .collection("rooms").document(roomId)
            .collection("submissions")
            .whereField("playerId", isEqualTo: playerId)
            .order(by: "createdAt", descending: false)
        return firestore.listenToCollection(query)
    }

    func hasSubmitted(roomId: String, playerId: String, dareId: String) async throws -> Bool {
        let snap = try await firestore.db
            .collection("rooms").document(roomId)
            .collection("submissions")
            .whereField("playerId", isEqualTo: playerId)
            .whereField("dareId", isEqualTo: dareId)
            .limit(to: 1)
            .getDocuments()
        return !snap.isEmpty
    }
}
