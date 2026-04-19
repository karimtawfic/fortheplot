import Foundation

struct ScoreEntry: Identifiable, Equatable {
    var id: String { playerId }
    var playerId: String
    var displayName: String
    var avatarEmoji: String
    var totalPoints: Int
    var rank: Int
}

struct LeaderboardSnapshot: Equatable {
    var entries: [ScoreEntry]
    var updatedAt: Date

    init(players: [Player]) {
        let sorted = players.sorted {
            if $0.totalPoints != $1.totalPoints { return $0.totalPoints > $1.totalPoints }
            return $0.joinedAt < $1.joinedAt
        }
        entries = sorted.enumerated().map { idx, player in
            ScoreEntry(
                playerId: player.playerId,
                displayName: player.displayName,
                avatarEmoji: player.avatarEmoji,
                totalPoints: player.totalPoints,
                rank: idx + 1
            )
        }
        updatedAt = Date()
    }

    func entry(for playerId: String) -> ScoreEntry? {
        entries.first { $0.playerId == playerId }
    }
}

extension LeaderboardSnapshot {
    static var preview: LeaderboardSnapshot {
        LeaderboardSnapshot(players: Player.previewPlayers)
    }
}
