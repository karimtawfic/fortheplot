import SwiftUI

@MainActor
final class LobbyViewModel: ObservableObject {
    @Published var room: Room?
    @Published var players: [Player] = []
    @Published var isStarting = false
    @Published var error: String?
    @Published var navigateToGame = false

    private let roomRepo = RoomRepository()
    private let playerRepo = PlayerRepository()
    private var roomTask: Task<Void, Never>?
    private var playersTask: Task<Void, Never>?

    var isHost: Bool {
        guard let room, let player = players.first(where: { $0.playerId == AuthService.shared.currentUID }) else {
            return false
        }
        return player.isHost && room.hostPlayerId == player.playerId
    }

    var canStart: Bool {
        (room?.currentPlayerCount ?? 0) >= 1 // allow solo testing; prod: >= 2
    }

    func startListening(roomId: String) {
        roomTask = Task {
            for await updatedRoom in roomRepo.listenToRoom(roomId: roomId) {
                guard let updatedRoom else { continue }
                room = updatedRoom
                if updatedRoom.status == .live {
                    navigateToGame = true
                }
            }
        }

        playersTask = Task {
            for await updatedPlayers in playerRepo.listenToPlayers(roomId: roomId) {
                players = updatedPlayers
            }
        }
    }

    func stopListening() {
        roomTask?.cancel()
        playersTask?.cancel()
    }

    func startGame() async {
        guard let room else { return }
        isStarting = true
        error = nil
        do {
            try await roomRepo.startGame(roomId: room.roomId, timerMinutes: room.timerMinutes)
        } catch {
            self.error = error.localizedDescription
        }
        isStarting = false
    }
}
