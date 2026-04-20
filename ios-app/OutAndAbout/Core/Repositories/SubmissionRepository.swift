import Foundation
import FirebaseFirestore
import FirebaseFunctions

protocol SubmissionRepositoryProtocol {
    func submit(
        submissionId: String,
        dare: Dare,
        roomId: String,
        mediaType: MediaType,
        mediaUrl: String,
        thumbnailUrl: String,
        metadata: [String: Any]?
    ) async throws -> SubmitDareResult

    func listenToAllSubmissions(roomId: String) -> AsyncStream<[DareSubmission]>
    func listenToPlayerSubmissions(roomId: String, playerId: String) -> AsyncStream<[DareSubmission]>
}

struct SubmitDareResult {
    let submissionId: String
    let pointsAwarded: Int
    let newTotal: Int
    let verificationStatus: VerificationStatus
    let verificationReason: String?
}

final class SubmissionRepository: SubmissionRepositoryProtocol {
    private let firestore = FirestoreService.shared
    private let functions = Functions.functions()

    func submit(
        submissionId: String,
        dare: Dare,
        roomId: String,
        mediaType: MediaType,
        mediaUrl: String,
        thumbnailUrl: String,
        metadata: [String: Any]? = nil
    ) async throws -> SubmitDareResult {
        let callable = functions.httpsCallable("submitDare")

        var payload: [String: Any] = [
            "submissionId": submissionId,
            "roomId": roomId,
            "dareId": dare.dareId,
            "mediaType": mediaType.rawValue,
            "mediaUrl": mediaUrl,
            "thumbnailUrl": thumbnailUrl,
        ]
        if let meta = metadata {
            payload["metadata"] = meta
        }

        let result = try await callable.call(payload)

        guard let data = result.data as? [String: Any],
              let sid = data["submissionId"] as? String,
              let pointsAwarded = data["pointsAwarded"] as? Int,
              let newTotal = data["newTotal"] as? Int,
              let statusRaw = data["verificationStatus"] as? String else {
            throw RepositoryError.invalidResponse
        }

        let status = VerificationStatus(rawValue: statusRaw) ?? .approved
        return SubmitDareResult(
            submissionId: sid,
            pointsAwarded: pointsAwarded,
            newTotal: newTotal,
            verificationStatus: status,
            verificationReason: data["verificationReason"] as? String
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
}
