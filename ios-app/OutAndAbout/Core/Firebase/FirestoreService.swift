import Foundation
import FirebaseFirestore

final class FirestoreService {
    static let shared = FirestoreService()

    let db: Firestore

    private init() {
        db = Firestore.firestore()
    }

    // MARK: - Async Read

    func getDocument<T: Decodable>(_ ref: DocumentReference) async throws -> T {
        let snapshot = try await ref.getDocument()
        guard snapshot.exists else {
            throw FirestoreError.documentNotFound(ref.documentID)
        }
        return try snapshot.data(as: T.self)
    }

    func getCollection<T: Decodable>(_ query: Query) async throws -> [T] {
        let snapshot = try await query.getDocuments()
        return try snapshot.documents.map { try $0.data(as: T.self) }
    }

    // MARK: - Async Write

    func setDocument<T: Encodable>(_ ref: DocumentReference, data: T, merge: Bool = false) async throws {
        try ref.setData(from: data, merge: merge)
    }

    func updateDocument(_ ref: DocumentReference, fields: [String: Any]) async throws {
        try await ref.updateData(fields)
    }

    func deleteDocument(_ ref: DocumentReference) async throws {
        try await ref.delete()
    }

    // MARK: - Realtime Listeners via AsyncStream

    func listenToDocument<T: Decodable & Sendable>(
        _ ref: DocumentReference
    ) -> AsyncStream<T?> {
        AsyncStream { continuation in
            let listener = ref.addSnapshotListener { snapshot, error in
                if let error {
                    print("[Firestore] Listener error for \(ref.documentID): \(error)")
                    continuation.yield(nil)
                    return
                }
                guard let snapshot, snapshot.exists else {
                    continuation.yield(nil)
                    return
                }
                let decoded = try? snapshot.data(as: T.self)
                continuation.yield(decoded)
            }
            continuation.onTermination = { _ in
                listener.remove()
            }
        }
    }

    func listenToCollection<T: Decodable & Sendable>(
        _ query: Query
    ) -> AsyncStream<[T]> {
        AsyncStream { continuation in
            let listener = query.addSnapshotListener { snapshot, error in
                if let error {
                    print("[Firestore] Collection listener error: \(error)")
                    continuation.yield([])
                    return
                }
                let items = snapshot?.documents.compactMap { doc -> T? in
                    try? doc.data(as: T.self)
                } ?? []
                continuation.yield(items)
            }
            continuation.onTermination = { _ in
                listener.remove()
            }
        }
    }
}

enum FirestoreError: LocalizedError {
    case documentNotFound(String)
    case decodingFailed(String)

    var errorDescription: String? {
        switch self {
        case .documentNotFound(let id): return "Document '\(id)' not found."
        case .decodingFailed(let msg): return "Decoding failed: \(msg)"
        }
    }
}
