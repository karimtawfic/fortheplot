import Foundation
import FirebaseFirestore

protocol DareRepositoryProtocol {
    func fetchDares() async throws -> [Dare]
}

final class DareRepository: DareRepositoryProtocol {
    private let firestore = FirestoreService.shared

    func fetchDares() async throws -> [Dare] {
        let query = firestore.db.collection("dares")
            .whereField("active", isEqualTo: true)
            .order(by: "category")
        let snapshot = try await query.getDocuments()
        return try snapshot.documents.map { try $0.data(as: Dare.self) }
    }
}
