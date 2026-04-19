import SwiftUI

struct GameEndView: View {
    let roomId: String

    @EnvironmentObject var appState: AppState
    @StateObject private var viewModel = GameEndViewModel()
    @State private var showPersonalReel = false
    @State private var showGroupReel = false
    @State private var showGallery = false
    @State private var confettiTrigger = 0

    var body: some View {
        ZStack {
            Color.appBackground.ignoresSafeArea()

            ScrollView(showsIndicators: false) {
                VStack(spacing: 28) {
                    gameOverHeader
                    myResultCard
                    reelButtons
                    galleryButton
                    finalLeaderboard
                    playAgainButton
                }
                .padding(20)
                .padding(.bottom, 40)
            }
        }
        .navigationBarHidden(true)
        .task {
            await viewModel.load(roomId: roomId)
            confettiTrigger += 1
        }
        .onDisappear { viewModel.stopListening() }
        .sheet(isPresented: $showPersonalReel) {
            if let job = viewModel.personalReelJob {
                ReelPreviewView(job: job)
            } else {
                ReelStatusView(roomId: roomId, isPersonal: true)
            }
        }
        .sheet(isPresented: $showGroupReel) {
            if let job = viewModel.groupReelJob {
                ReelPreviewView(job: job)
            } else {
                ReelStatusView(roomId: roomId, isPersonal: false)
            }
        }
        .sheet(isPresented: $showGallery) {
            // Gallery embedded here — simplified
            Text("Gallery").foregroundColor(.white)
        }
    }

    // MARK: - Sections

    private var gameOverHeader: some View {
        VStack(spacing: 8) {
            Text("🎉")
                .font(.system(size: 64))
            Text("Game Over!")
                .font(.system(size: 36, weight: .black, design: .rounded))
                .foregroundStyle(LinearGradient.appHeroGradient)
            if let winner = viewModel.winner {
                Text("\(winner.avatarEmoji) \(winner.displayName) wins with \(winner.totalPoints) pts!")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.appGold)
                    .multilineTextAlignment(.center)
            }
        }
        .padding(.top, 20)
    }

    private var myResultCard: some View {
        VStack(spacing: 8) {
            HStack(spacing: 6) {
                if let rank = viewModel.myRank {
                    Text(rankEmoji(rank))
                        .font(.system(size: 32))
                }
                Text("Your Score")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.appTextSecondary)
                    .textCase(.uppercase)
                    .tracking(1)
            }
            Text("\(viewModel.myPoints)")
                .font(.system(size: 56, weight: .black))
                .foregroundColor(.appGold)
                .contentTransition(.numericText())
            Text("points")
                .font(.system(size: 16))
                .foregroundColor(.appTextSecondary)
        }
        .frame(maxWidth: .infinity)
        .padding(24)
        .background(
            ZStack {
                Color.appSurface
                LinearGradient(colors: [Color.appGold.opacity(0.08), Color.clear], startPoint: .top, endPoint: .bottom)
            }
        )
        .cornerRadius(20)
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(Color.appGold.opacity(0.3), lineWidth: 1.5)
        )
    }

    private var reelButtons: some View {
        VStack(spacing: 10) {
            Text("YOUR REELS")
                .font(.system(size: 12, weight: .semibold))
                .foregroundColor(.appTextSecondary)
                .tracking(2)
                .frame(maxWidth: .infinity, alignment: .leading)

            Button {
                showPersonalReel = true
            } label: {
                HStack {
                    Image(systemName: "film.fill")
                    Text("My Personal Reel")
                    Spacer()
                    if viewModel.personalReelJob?.isProcessing == true {
                        ProgressView().tint(.white).scaleEffect(0.8)
                    } else if viewModel.personalReelReady {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.appSuccess)
                    } else {
                        Text("Generating…")
                            .font(.system(size: 13))
                            .foregroundColor(.appTextSecondary)
                    }
                }
            }
            .primaryButtonStyle()

            Button {
                showGroupReel = true
            } label: {
                HStack {
                    Image(systemName: "person.3.fill")
                    Text("Group Reel")
                    Spacer()
                    if viewModel.groupReelJob?.isProcessing == true {
                        ProgressView().tint(.appPrimary).scaleEffect(0.8)
                    } else if viewModel.groupReelReady {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.appSuccess)
                    } else {
                        Text("Generating…")
                            .font(.system(size: 13))
                            .foregroundColor(.appTextSecondary)
                    }
                }
            }
            .secondaryButtonStyle()
        }
    }

    private var galleryButton: some View {
        Button {
            showGallery = true
        } label: {
            Label("View All Submissions", systemImage: "photo.on.rectangle.angled")
        }
        .secondaryButtonStyle()
    }

    private var finalLeaderboard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("FINAL STANDINGS")
                .font(.system(size: 12, weight: .semibold))
                .foregroundColor(.appTextSecondary)
                .tracking(2)

            if let lb = viewModel.leaderboard {
                ForEach(lb.entries.prefix(10)) { entry in
                    HStack(spacing: 12) {
                        Text(rankEmoji(entry.rank))
                            .font(.system(size: 18))
                            .frame(width: 28)
                        Text(entry.avatarEmoji)
                            .font(.system(size: 22))
                        Text(entry.displayName)
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundColor(entry.playerId == viewModel.currentPlayerId ? .appGold : .white)
                        Spacer()
                        Text("\(entry.totalPoints) pts")
                            .font(.system(size: 15, weight: .bold))
                            .foregroundColor(entry.playerId == viewModel.currentPlayerId ? .appGold : .appTextSecondary)
                    }
                    .padding(.vertical, 4)
                }
            } else {
                ProgressView().tint(.appPrimary)
            }
        }
        .padding(20)
        .background(Color.appSurface)
        .cornerRadius(20)
    }

    private var playAgainButton: some View {
        Button {
            appState.clearSession()
        } label: {
            Label("Back to Home", systemImage: "house.fill")
        }
        .secondaryButtonStyle()
    }

    private func rankEmoji(_ rank: Int) -> String {
        switch rank {
        case 1: return "🥇"
        case 2: return "🥈"
        case 3: return "🥉"
        default: return "#\(rank)"
        }
    }
}

#Preview {
    GameEndView(roomId: "preview-room-123")
        .environmentObject(AppState())
}
