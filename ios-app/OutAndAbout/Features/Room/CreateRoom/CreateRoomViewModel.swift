import SwiftUI

@MainActor
final class CreateRoomViewModel: ObservableObject {
    @Published var displayName = ""
    @Published var selectedEmoji = "😊"
    @Published var timerMinutes = 30
    @Published var isLoading = false
    @Published var error: String?
    @Published var createdRoom: Room?
    @Published var currentPlayer: Player?

    let timerOptions = [5, 10, 15, 30, 45, 60, 90, 120]
    let emojiOptions = ["😊", "🔥", "⚡", "🎯", "🌟", "💥", "🦁", "🐉", "🎮", "🏆",
                        "🦊", "🐺", "🎪", "🌈", "💎", "🚀", "🎸", "🏄", "🧨", "🎭"]

    private let roomRepo = RoomRepository()

    var canCreate: Bool {
        !displayName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    func createRoom(appState: AppState) async {
        guard canCreate else { return }
        isLoading = true
        error = nil

        do {
            let (room, player) = try await roomRepo.createRoom(
                displayName: displayName.trimmingCharacters(in: .whitespacesAndNewlines),
                avatarEmoji: selectedEmoji,
                timerMinutes: timerMinutes
            )
            appState.setRoom(room, player: player)
            createdRoom = room
            currentPlayer = player
            UINotificationFeedbackGenerator().notificationOccurred(.success)
        } catch {
            self.error = error.localizedDescription
            UINotificationFeedbackGenerator().notificationOccurred(.error)
        }
        isLoading = false
    }

    func timerLabel(_ minutes: Int) -> String {
        if minutes < 60 { return "\(minutes) min" }
        let hours = minutes / 60
        let remaining = minutes % 60
        return remaining == 0 ? "\(hours)h" : "\(hours)h \(remaining)m"
    }
}
