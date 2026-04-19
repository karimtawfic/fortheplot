import Foundation
import FirebaseAuth

final class AuthService {
    static let shared = AuthService()
    private init() {}

    var currentUser: FirebaseAuth.User? {
        Auth.auth().currentUser
    }

    var currentUID: String? {
        Auth.auth().currentUser?.uid
    }

    func signInAnonymously() async throws -> FirebaseAuth.User {
        let result = try await Auth.auth().signInAnonymously()
        return result.user
    }

    func signOut() throws {
        try Auth.auth().signOut()
    }
}
