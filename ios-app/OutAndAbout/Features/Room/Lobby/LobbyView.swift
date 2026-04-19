import SwiftUI

struct LobbyView: View {
    let roomId: String
    @Binding var path: NavigationPath

    @EnvironmentObject var appState: AppState
    @StateObject private var viewModel = LobbyViewModel()

    var body: some View {
        ZStack {
            Color.appBackground.ignoresSafeArea()

            VStack(spacing: 0) {
                inviteCodeSection
                playerListSection
                Spacer()
                bottomSection
            }
        }
        .navigationTitle("Lobby")
        .navigationBarTitleDisplayMode(.inline)
        .navigationBarBackButtonHidden(false)
        .errorAlert(error: $viewModel.error)
        .onAppear {
            viewModel.startListening(roomId: roomId)
        }
        .onDisappear {
            viewModel.stopListening()
        }
        .onChange(of: viewModel.navigateToGame) { shouldNavigate in
            if shouldNavigate {
                path.append(HomeRoute.gameplay(roomId: roomId))
            }
        }
    }

    // MARK: - Sections

    private var inviteCodeSection: some View {
        VStack(spacing: 12) {
            Text("Share this code")
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(.appTextSecondary)
                .textCase(.uppercase)
                .tracking(2)

            Text(viewModel.room?.inviteCode ?? "------")
                .font(.system(size: 52, weight: .black, design: .monospaced))
                .foregroundColor(.appPrimary)
                .kerning(8)

            ShareLink(item: "Join my Out & About game! Code: \(viewModel.room?.inviteCode ?? "")") {
                Label("Share Invite", systemImage: "square.and.arrow.up")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.appPrimary)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 10)
                    .background(Color.appPrimary.opacity(0.12))
                    .cornerRadius(12)
            }

            Text("\(viewModel.room?.playerCountDisplay ?? "0/20") players joined")
                .font(.system(size: 14))
                .foregroundColor(.appTextSecondary)
        }
        .padding(24)
        .frame(maxWidth: .infinity)
        .background(Color.appSurface)
    }

    private var playerListSection: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Players")
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(.appTextSecondary)
                .textCase(.uppercase)
                .tracking(2)
                .padding(.horizontal, 24)
                .padding(.top, 20)
                .padding(.bottom, 12)

            ScrollView {
                LazyVStack(spacing: 1) {
                    ForEach(viewModel.players) { player in
                        playerRow(player)
                    }
                }
            }
        }
    }

    private func playerRow(_ player: Player) -> some View {
        HStack(spacing: 14) {
            Text(player.avatarEmoji)
                .font(.system(size: 32))
                .frame(width: 48, height: 48)
                .background(Color.appSurface2)
                .cornerRadius(12)

            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Text(player.displayName)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.white)
                    if player.isHost {
                        Text("HOST")
                            .font(.system(size: 10, weight: .black))
                            .foregroundColor(.appGold)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.appGold.opacity(0.15))
                            .cornerRadius(4)
                    }
                    if player.playerId == AuthService.shared.currentUID {
                        Text("YOU")
                            .font(.system(size: 10, weight: .black))
                            .foregroundColor(.appPrimary)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.appPrimary.opacity(0.15))
                            .cornerRadius(4)
                    }
                }
                Text("Ready")
                    .font(.system(size: 12))
                    .foregroundColor(.appSuccess)
            }

            Spacer()
        }
        .padding(.horizontal, 24)
        .padding(.vertical, 14)
        .background(Color.appBackground)
    }

    private var bottomSection: some View {
        VStack(spacing: 12) {
            if viewModel.isHost {
                // Timer display
                if let room = viewModel.room {
                    HStack {
                        Image(systemName: "timer")
                            .foregroundColor(.appTextSecondary)
                        Text("Game duration: \(timerLabel(room.timerMinutes))")
                            .font(.system(size: 14))
                            .foregroundColor(.appTextSecondary)
                    }
                }

                Button {
                    UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
                    Task { await viewModel.startGame() }
                } label: {
                    Text("Start Game")
                }
                .primaryButtonStyle(isLoading: viewModel.isStarting, isDisabled: !viewModel.canStart)
                .disabled(!viewModel.canStart || viewModel.isStarting)
            } else {
                VStack(spacing: 8) {
                    ProgressView()
                        .tint(.appPrimary)
                    Text("Waiting for the host to start…")
                        .font(.system(size: 15))
                        .foregroundColor(.appTextSecondary)
                }
                .padding(.vertical, 12)
            }
        }
        .padding(24)
        .background(Color.appSurface)
    }

    private func timerLabel(_ minutes: Int) -> String {
        if minutes < 60 { return "\(minutes) min" }
        let h = minutes / 60; let m = minutes % 60
        return m == 0 ? "\(h)h" : "\(h)h \(m)m"
    }
}

#Preview {
    NavigationStack {
        LobbyView(roomId: "preview-room-123", path: .constant(NavigationPath()))
            .environmentObject(AppState())
    }
}
