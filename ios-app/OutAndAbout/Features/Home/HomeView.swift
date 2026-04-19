import SwiftUI

struct HomeView: View {
    @EnvironmentObject var appState: AppState
    @StateObject private var viewModel = HomeViewModel()
    @State private var showInstructions = false
    @State private var path = NavigationPath()

    var body: some View {
        NavigationStack(path: $path) {
            ZStack {
                Color.appBackground.ignoresSafeArea()

                ScrollView(showsIndicators: false) {
                    VStack(spacing: 0) {
                        headerSection
                        heroSection
                        instructionHighlights
                        actionButtons
                        Spacer(minLength: 40)
                    }
                }
            }
            .navigationBarHidden(true)
            .navigationDestination(for: HomeRoute.self) { route in
                switch route {
                case .createRoom:
                    CreateRoomView(path: $path)
                case .joinRoom:
                    JoinRoomView(path: $path)
                case .lobby(let roomId):
                    LobbyView(roomId: roomId, path: $path)
                case .gameplay(let roomId):
                    GameplayView(roomId: roomId)
                }
            }
        }
        .sheet(isPresented: $showInstructions) {
            InstructionsView()
        }
        .onAppear {
            // Resume an in-progress game if the player was in one
            viewModel.checkForActiveRoom(appState: appState, path: $path)
        }
    }

    // MARK: - Sections

    private var headerSection: some View {
        HStack {
            Text("🌍 Out & About")
                .font(.system(size: 22, weight: .black, design: .rounded))
                .foregroundStyle(LinearGradient.appHeroGradient)

            Spacer()

            Button {
                showInstructions = true
            } label: {
                Image(systemName: "questionmark.circle.fill")
                    .font(.system(size: 24))
                    .foregroundColor(.appTextSecondary)
            }
            .accessibilityLabel("How to play")
        }
        .padding(.horizontal, 24)
        .padding(.top, 20)
        .padding(.bottom, 8)
    }

    private var heroSection: some View {
        VStack(spacing: 16) {
            Text("Real world.\nReal dares.\nReal fun.")
                .font(.system(size: 40, weight: .black, design: .rounded))
                .foregroundColor(.white)
                .multilineTextAlignment(.center)
                .lineSpacing(4)
                .padding(.top, 32)

            Text("Gather your crew, pick your dares,\nand compete in the real world.")
                .font(.system(size: 16, weight: .regular))
                .foregroundColor(.appTextSecondary)
                .multilineTextAlignment(.center)
                .lineSpacing(4)
        }
        .padding(.horizontal, 24)
        .padding(.bottom, 40)
    }

    private var instructionHighlights: some View {
        VStack(spacing: 12) {
            instructionRow(icon: "🏠", title: "Create or join a room", detail: "Share a 6-letter code with friends")
            instructionRow(icon: "🤳", title: "Upload your selfie", detail: "Pick an emoji avatar to represent you")
            instructionRow(icon: "👆", title: "Swipe through dares", detail: "Browse 30+ dares across 5 categories")
            instructionRow(icon: "📸", title: "Prove it with photo or video", detail: "Capture proof to claim your points")
            instructionRow(icon: "🏆", title: "Watch the live leaderboard", detail: "Points update in real time for everyone")
            instructionRow(icon: "🎬", title: "Get your personal reel", detail: "Every game ends with highlight reels for everyone")
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 40)
    }

    private func instructionRow(icon: String, title: String, detail: String) -> some View {
        HStack(alignment: .top, spacing: 16) {
            Text(icon)
                .font(.system(size: 28))
                .frame(width: 44)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(.white)
                Text(detail)
                    .font(.system(size: 13, weight: .regular))
                    .foregroundColor(.appTextSecondary)
            }
            Spacer()
        }
        .padding(16)
        .background(Color.appSurface)
        .cornerRadius(14)
    }

    private var actionButtons: some View {
        VStack(spacing: 14) {
            Button {
                UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                path.append(HomeRoute.createRoom)
            } label: {
                Text("Create a Room")
            }
            .primaryButtonStyle()
            .padding(.horizontal, 24)

            Button {
                UIImpactFeedbackGenerator(style: .light).impactOccurred()
                path.append(HomeRoute.joinRoom)
            } label: {
                Text("Join a Room")
            }
            .secondaryButtonStyle()
            .padding(.horizontal, 24)
        }
    }
}

enum HomeRoute: Hashable {
    case createRoom
    case joinRoom
    case lobby(roomId: String)
    case gameplay(roomId: String)
}

#Preview {
    HomeView().environmentObject(AppState())
}
