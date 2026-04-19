import SwiftUI

@MainActor
final class ReelViewModel: ObservableObject {
    @Published var personalJob: ReelJob?
    @Published var groupJob: ReelJob?
    @Published var isLoadingPersonal = true
    @Published var isLoadingGroup = true

    private let reelRepo = ReelRepository()
    private var listeners: [Task<Void, Never>] = []

    func startListening(roomId: String, playerId: String) {
        let personalTask = Task {
            for await job in reelRepo.listenToPlayerReelJob(roomId: roomId, playerId: playerId) {
                personalJob = job
                isLoadingPersonal = false
            }
        }

        let groupTask = Task {
            for await job in reelRepo.listenToGroupReelJob(roomId: roomId) {
                groupJob = job
                isLoadingGroup = false
            }
        }

        listeners = [personalTask, groupTask]
    }

    func stopListening() {
        listeners.forEach { $0.cancel() }
        listeners = []
    }

    func retryJob(_ job: ReelJob) async {
        // Trigger retry via Cloud Function
        // Implementation would call retryReelJob callable
    }
}
