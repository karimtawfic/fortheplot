import Foundation

// All preview data lives in the model extensions.
// This file provides convenience groupings for SwiftUI Previews.

enum PreviewData {
    static let room = Room.preview
    static let liveRoom = Room.previewLive
    static let player = Player.preview
    static let players = Player.previewPlayers
    static let dare = Dare.preview
    static let dares = Dare.previewDares
    static let submission = DareSubmission.preview
    static let leaderboard = LeaderboardSnapshot.preview
    static let reelProcessing = ReelJob.previewProcessing
    static let reelComplete = ReelJob.previewComplete
    static let timer = GameTimerState.preview
    static let timerWarning = GameTimerState.previewWarning
}
