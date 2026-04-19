import SwiftUI
import FirebaseAuth

@MainActor
final class AppState: ObservableObject {
    @Published var currentUser: FirebaseAuth.User?
    @Published var currentRoom: Room?
    @Published var currentPlayer: Player?
    @Published var isAuthenticating = false
    @Published var authError: String?

    private let authService = AuthService.shared

    init() {
        currentUser = Auth.auth().currentUser
    }

    func signInAnonymously() async {
        guard currentUser == nil else { return }
        isAuthenticating = true
        authError = nil
        do {
            currentUser = try await authService.signInAnonymously()
        } catch {
            authError = error.localizedDescription
        }
        isAuthenticating = false
    }

    func setRoom(_ room: Room, player: Player) {
        currentRoom = room
        currentPlayer = player
    }

    func clearSession() {
        currentRoom = nil
        currentPlayer = nil
    }
}
