import SwiftUI

@MainActor
final class GameEndViewModel: ObservableObject {
    @Published var leaderboard: LeaderboardSnapshot?
    @Published var room: Room?
    @Published var personalReelJob: ReelJob?
    @Published var groupReelJob: ReelJob?
    @Published var isLoading = true

    private let roomRepo = RoomRepository()
    private let playerRepo = PlayerRepository()
    private let reelRepo = ReelRepository()
    private var listeners: [Task<Void, Never>] = []

    var currentPlayerId: String { AuthService.shared.currentUID ?? "" }

    var myRank: Int? { leaderboard?.entry(for: currentPlayerId)?.rank }
    var myPoints: Int { leaderboard?.entry(for: currentPlayerId)?.totalPoints ?? 0 }
    var winner: ScoreEntry? { leaderboard?.entries.first }

    var personalReelReady: Bool { personalReelJob?.isComplete == true }
    var groupReelReady: Bool { groupReelJob?.isComplete == true }
    var anyReelProcessing: Bool {
        personalReelJob?.isProcessing == true || groupReelJob?.isProcessing == true
    }

    func load(roomId: String) async {
        isLoading = true

        // One-time fetch of final leaderboard via a short-lived task
        let fetchTask = Task { () -> [Player] in
            var result: [Player] = []
            for await batch in playerRepo.listenToPlayers(roomId: roomId) {
                result = batch
                break
            }
            return result
        }
        if let players = await fetchTask.value as [Player]? {
            leaderboard = LeaderboardSnapshot(players: players)
        }

        isLoading = false

        // Listen for reel job completion
        startListening(roomId: roomId)
    }

    func startListening(roomId: String) {
        let playerTask = Task {
            for await players in playerRepo.listenToPlayers(roomId: roomId) {
                leaderboard = LeaderboardSnapshot(players: players)
            }
        }

        let personalTask = Task {
            for await job in reelRepo.listenToPlayerReelJob(roomId: roomId, playerId: currentPlayerId) {
                personalReelJob = job
            }
        }

        let groupTask = Task {
            for await job in reelRepo.listenToGroupReelJob(roomId: roomId) {
                groupReelJob = job
            }
        }

        listeners = [playerTask, personalTask, groupTask]
    }

    func stopListening() {
        listeners.forEach { $0.cancel() }
        listeners = []
    }
}

