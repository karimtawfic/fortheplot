import SwiftUI

@MainActor
final class JoinRoomViewModel: ObservableObject {
    @Published var inviteCode = ""
    @Published var displayName = ""
    @Published var selectedEmoji = "😊"
    @Published var isLoading = false
    @Published var error: String?
    @Published var joinedRoom: Room?

    let emojiOptions = ["😊", "🔥", "⚡", "🎯", "🌟", "💥", "🦁", "🐉", "🎮", "🏆",
                        "🦊", "🐺", "🎪", "🌈", "💎", "🚀", "🎸", "🏄", "🧨", "🎭"]

    private let roomRepo = RoomRepository()

    var canJoin: Bool {
        inviteCode.count == 6
        && !displayName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    var formattedCode: String {
        inviteCode.uppercased().prefix(6).map(String.init).joined()
    }

    func joinRoom(appState: AppState) async {
        guard canJoin else { return }
        isLoading = true
        error = nil

        do {
            let (room, player) = try await roomRepo.joinRoom(
                inviteCode: inviteCode.uppercased(),
                displayName: displayName.trimmingCharacters(in: .whitespacesAndNewlines),
                avatarEmoji: selectedEmoji
            )
            appState.setRoom(room, player: player)
            joinedRoom = room
            UINotificationFeedbackGenerator().notificationOccurred(.success)
        } catch {
            self.error = error.localizedDescription
            UINotificationFeedbackGenerator().notificationOccurred(.error)
        }
        isLoading = false
    }
}
