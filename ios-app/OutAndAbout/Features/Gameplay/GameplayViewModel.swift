import SwiftUI
import Combine

enum ViewMode {
    case swipe
    case grid
}

@MainActor
final class GameplayViewModel: ObservableObject {
    @Published var dares: [Dare] = []
    @Published var timerState: GameTimerState?
    @Published var leaderboard: LeaderboardSnapshot?
    @Published var submittedDareIds: Set<String> = []
    @Published var allSubmissions: [DareSubmission] = []
    @Published var playerPoints: Int = 0
    @Published var viewMode: ViewMode = .swipe
    @Published var selectedDare: Dare?
    @Published var showProofUpload = false
    @Published var showScoreboard = false
    @Published var isGameOver = false
    @Published var error: String?
    @Published var currentCardIndex = 0
    @Published var isLoadingDares = true

    private var roomId: String = ""
    private var playerId: String = ""

    private let roomRepo = RoomRepository()
    private let playerRepo = PlayerRepository()
    private let dareRepo = DareRepository()
    private let submissionRepo = SubmissionRepository()

    private var listeners: [Task<Void, Never>] = []
    private var timerRefreshTask: Task<Void, Never>?

    func setup(roomId: String, playerId: String) {
        self.roomId = roomId
        self.playerId = playerId
    }

    func startListening() {
        // Room listener for timer and status
        let roomTask = Task {
            for await room in roomRepo.listenToRoom(roomId: roomId) {
                guard let room else { continue }
                if let endsAt = room.endsAt {
                    timerState = GameTimerState(endsAt: endsAt)
                }
                if room.status == .ended || room.status == .rendering {
                    isGameOver = true
                }
            }
        }

        // Player submissions
        let submissionsTask = Task {
            for await subs in submissionRepo.listenToPlayerSubmissions(roomId: roomId, playerId: playerId) {
                submittedDareIds = Set(subs.map(\.dareId))
                playerPoints = subs.reduce(0) { $0 + $1.pointsAwarded }
            }
        }

        // All submissions (for gallery)
        let allSubsTask = Task {
            for await subs in submissionRepo.listenToAllSubmissions(roomId: roomId) {
                allSubmissions = subs
            }
        }

        // Leaderboard
        let leaderboardTask = Task {
            for await players in playerRepo.listenToPlayers(roomId: roomId) {
                leaderboard = LeaderboardSnapshot(players: players)
                if let me = players.first(where: { $0.playerId == playerId }) {
                    playerPoints = me.totalPoints
                }
            }
        }

        listeners = [roomTask, submissionsTask, allSubsTask, leaderboardTask]

        // Local timer tick (updates displayed countdown every second)
        timerRefreshTask = Task {
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 1_000_000_000)
                // Force a re-render by nudging the timer
                if let current = timerState {
                    timerState = current // triggers @Published update
                }
            }
        }
    }

    func stopListening() {
        listeners.forEach { $0.cancel() }
        timerRefreshTask?.cancel()
        listeners = []
        timerRefreshTask = nil
    }

    func loadDares() async {
        isLoadingDares = true
        do {
            dares = try await dareRepo.fetchDares()
        } catch {
            self.error = "Failed to load dares: \(error.localizedDescription)"
        }
        isLoadingDares = false
    }

    func selectDareForProof(_ dare: Dare) {
        guard !isAlreadyCompleted(dare) else { return }
        selectedDare = dare
        showProofUpload = true
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
    }

    func isAlreadyCompleted(_ dare: Dare) -> Bool {
        submittedDareIds.contains(dare.dareId)
    }

    func toggleViewMode() {
        withAnimation(.spring(response: 0.35, dampingFraction: 0.7)) {
            viewMode = viewMode == .swipe ? .grid : .swipe
        }
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
    }

    var completedCount: Int { submittedDareIds.count }
    var totalDares: Int { dares.count }
}
