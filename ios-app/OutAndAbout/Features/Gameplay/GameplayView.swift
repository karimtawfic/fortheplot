import SwiftUI

struct GameplayView: View {
    let roomId: String

    @EnvironmentObject var appState: AppState
    @StateObject private var viewModel = GameplayViewModel()

    var body: some View {
        ZStack {
            Color.appBackground.ignoresSafeArea()

            if viewModel.isGameOver {
                GameEndView(roomId: roomId)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
            } else {
                mainContent
            }
        }
        .navigationBarHidden(true)
        .animation(.easeInOut(duration: 0.4), value: viewModel.isGameOver)
        .onAppear {
            let playerId = appState.currentPlayer?.playerId ?? AuthService.shared.currentUID ?? ""
            viewModel.setup(roomId: roomId, playerId: playerId)
            viewModel.startListening()
            Task { await viewModel.loadDares() }
        }
        .onDisappear {
            viewModel.stopListening()
        }
        .sheet(isPresented: $viewModel.showProofUpload) {
            if let dare = viewModel.selectedDare {
                ProofUploadView(
                    dare: dare,
                    roomId: roomId,
                    playerId: appState.currentPlayer?.playerId ?? ""
                )
            }
        }
        .sheet(isPresented: $viewModel.showScoreboard) {
            ScoreboardView(leaderboard: viewModel.leaderboard, currentPlayerId: appState.currentPlayer?.playerId ?? "")
        }
        .errorAlert(error: $viewModel.error)
    }

    private var mainContent: some View {
        VStack(spacing: 0) {
            topBar
            Divider().background(Color.appBorder)

            if viewModel.isLoadingDares {
                Spacer()
                ProgressView("Loading dares…")
                    .tint(.appPrimary)
                    .foregroundColor(.appTextSecondary)
                Spacer()
            } else {
                cardArea
            }

            bottomBar
        }
    }

    // MARK: - Top Bar

    private var topBar: some View {
        HStack(spacing: 16) {
            // Timer
            timerDisplay

            Spacer()

            // Points
            VStack(spacing: 2) {
                Text("\(viewModel.playerPoints)")
                    .font(.system(size: 28, weight: .black))
                    .foregroundColor(.appGold)
                    .contentTransition(.numericText())
                    .animation(.spring(response: 0.3), value: viewModel.playerPoints)
                Text("pts")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(.appTextSecondary)
                    .textCase(.uppercase)
            }

            // Leaderboard button
            Button {
                viewModel.showScoreboard = true
            } label: {
                Image(systemName: "list.number")
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundColor(.white)
                    .frame(width: 40, height: 40)
                    .background(Color.appSurface)
                    .cornerRadius(10)
            }
            .accessibilityLabel("Open leaderboard")
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 12)
        .background(Color.appBackground)
    }

    private var timerDisplay: some View {
        HStack(spacing: 6) {
            Image(systemName: "timer")
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(timerColor)
            Text(viewModel.timerState?.formattedTime ?? "--:--")
                .font(.system(size: 22, weight: .black, design: .monospaced))
                .foregroundColor(timerColor)
                .contentTransition(.numericText())
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 8)
        .background(timerColor.opacity(0.12))
        .cornerRadius(10)
    }

    private var timerColor: Color {
        if viewModel.timerState?.isCritical == true { return .red }
        if viewModel.timerState?.isWarning == true { return .orange }
        return .appTextSecondary
    }

    // MARK: - Card Area

    private var cardArea: some View {
        Group {
            if viewModel.viewMode == .swipe {
                SingleCardView(viewModel: viewModel)
                    .transition(.opacity)
            } else {
                GridCardView(viewModel: viewModel)
                    .transition(.opacity)
            }
        }
        .animation(.spring(response: 0.35, dampingFraction: 0.8), value: viewModel.viewMode)
    }

    // MARK: - Bottom Bar

    private var bottomBar: some View {
        HStack(spacing: 12) {
            Text("\(viewModel.completedCount)/\(viewModel.totalDares) dares")
                .font(.system(size: 13, weight: .medium))
                .foregroundColor(.appTextSecondary)

            Spacer()

            // View mode toggle
            Button {
                viewModel.toggleViewMode()
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: viewModel.viewMode == .swipe ? "square.grid.2x2" : "rectangle.stack")
                        .font(.system(size: 14, weight: .semibold))
                    Text(viewModel.viewMode == .swipe ? "Grid" : "Swipe")
                        .font(.system(size: 13, weight: .semibold))
                }
                .foregroundColor(.appPrimary)
                .padding(.horizontal, 14)
                .padding(.vertical, 8)
                .background(Color.appPrimary.opacity(0.12))
                .cornerRadius(10)
            }
            .accessibilityLabel("Switch to \(viewModel.viewMode == .swipe ? "grid" : "swipe") mode")
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 12)
        .background(Color.appBackground)
    }
}

#Preview {
    GameplayView(roomId: "preview-room-123")
        .environmentObject(AppState())
}
