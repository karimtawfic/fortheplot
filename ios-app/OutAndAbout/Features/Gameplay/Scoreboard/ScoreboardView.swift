import SwiftUI

struct ScoreboardView: View {
    let leaderboard: LeaderboardSnapshot?
    let currentPlayerId: String

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ZStack {
                Color.appBackground.ignoresSafeArea()

                if let lb = leaderboard, !lb.entries.isEmpty {
                    ScrollView(showsIndicators: false) {
                        LazyVStack(spacing: 2) {
                            ForEach(lb.entries) { entry in
                                scoreRow(entry, isCurrentPlayer: entry.playerId == currentPlayerId)
                            }
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                    }
                } else {
                    VStack(spacing: 12) {
                        Image(systemName: "person.3.fill")
                            .font(.system(size: 48))
                            .foregroundColor(.appTextSecondary)
                        Text("No scores yet")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundColor(.appTextSecondary)
                    }
                }
            }
            .navigationTitle("Leaderboard")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") { dismiss() }
                        .foregroundColor(.appPrimary)
                }
            }
        }
    }

    private func scoreRow(_ entry: ScoreEntry, isCurrentPlayer: Bool) -> some View {
        HStack(spacing: 14) {
            // Rank
            rankBadge(entry.rank)

            // Avatar
            Text(entry.avatarEmoji)
                .font(.system(size: 30))
                .frame(width: 44, height: 44)
                .background(isCurrentPlayer ? Color.appPrimary.opacity(0.2) : Color.appSurface2)
                .cornerRadius(12)

            // Name
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Text(entry.displayName)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.white)
                    if isCurrentPlayer {
                        Text("YOU")
                            .font(.system(size: 10, weight: .black))
                            .foregroundColor(.appPrimary)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.appPrimary.opacity(0.15))
                            .cornerRadius(4)
                    }
                }
            }

            Spacer()

            // Points
            Text("\(entry.totalPoints)")
                .font(.system(size: 22, weight: .black))
                .foregroundColor(isCurrentPlayer ? .appGold : .white)
                .contentTransition(.numericText())
                .animation(.spring(response: 0.3), value: entry.totalPoints)
        }
        .padding(14)
        .background(
            isCurrentPlayer
            ? Color.appPrimary.opacity(0.08)
            : Color.appSurface
        )
        .cornerRadius(14)
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(isCurrentPlayer ? Color.appPrimary.opacity(0.3) : Color.clear, lineWidth: 1)
        )
    }

    private func rankBadge(_ rank: Int) -> some View {
        ZStack {
            if rank <= 3 {
                Circle()
                    .fill(rankColor(rank))
                    .frame(width: 32, height: 32)
                Text(rankEmoji(rank))
                    .font(.system(size: 16))
            } else {
                Text("\(rank)")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundColor(.appTextSecondary)
                    .frame(width: 32)
            }
        }
    }

    private func rankColor(_ rank: Int) -> Color {
        switch rank {
        case 1: return Color.appGold.opacity(0.3)
        case 2: return Color(hex: "#C0C0C0").opacity(0.3)
        case 3: return Color(hex: "#CD7F32").opacity(0.3)
        default: return .clear
        }
    }

    private func rankEmoji(_ rank: Int) -> String {
        switch rank {
        case 1: return "🥇"
        case 2: return "🥈"
        case 3: return "🥉"
        default: return "\(rank)"
        }
    }
}

#Preview {
    ScoreboardView(leaderboard: .preview, currentPlayerId: "preview-player-1")
}
