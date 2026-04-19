import Foundation

struct GameTimerState: Equatable {
    let endsAt: Date

    var timeRemaining: TimeInterval {
        max(0, endsAt.timeIntervalSinceNow)
    }

    var isExpired: Bool {
        timeRemaining == 0
    }

    var isWarning: Bool {
        timeRemaining <= 60 && !isExpired
    }

    var isCritical: Bool {
        timeRemaining <= 30 && !isExpired
    }

    var formattedTime: String {
        let remaining = Int(timeRemaining)
        let hours = remaining / 3600
        let minutes = (remaining % 3600) / 60
        let seconds = remaining % 60

        if hours > 0 {
            return String(format: "%d:%02d:%02d", hours, minutes, seconds)
        }
        return String(format: "%02d:%02d", minutes, seconds)
    }

    var progress: Double {
        // Requires knowing total duration — used for progress arc if needed
        timeRemaining
    }
}

extension GameTimerState {
    static var preview: GameTimerState {
        GameTimerState(endsAt: Date().addingTimeInterval(1680))
    }

    static var previewWarning: GameTimerState {
        GameTimerState(endsAt: Date().addingTimeInterval(45))
    }

    static var previewExpired: GameTimerState {
        GameTimerState(endsAt: Date().addingTimeInterval(-1))
    }
}
