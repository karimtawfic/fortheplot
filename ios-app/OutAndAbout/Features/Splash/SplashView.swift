import SwiftUI

struct SplashView: View {
    @EnvironmentObject var appState: AppState
    @State private var showHome = false
    @State private var logoScale: CGFloat = 0.7
    @State private var logoOpacity: Double = 0

    var body: some View {
        ZStack {
            Color.appBackground.ignoresSafeArea()

            if showHome {
                HomeView()
                    .transition(.opacity)
            } else {
                splashContent
            }
        }
        .animation(.easeInOut(duration: 0.4), value: showHome)
        .task {
            await launch()
        }
    }

    private var splashContent: some View {
        VStack(spacing: 24) {
            Spacer()

            // Logo / wordmark
            VStack(spacing: 8) {
                Text("🌍")
                    .font(.system(size: 80))

                Text("Out & About")
                    .font(.system(size: 42, weight: .black, design: .rounded))
                    .foregroundStyle(LinearGradient.appHeroGradient)

                Text("The dare game")
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(.appTextSecondary)
                    .tracking(3)
                    .textCase(.uppercase)
            }
            .scaleEffect(logoScale)
            .opacity(logoOpacity)
            .onAppear {
                withAnimation(.spring(response: 0.7, dampingFraction: 0.6)) {
                    logoScale = 1
                    logoOpacity = 1
                }
            }

            Spacer()

            if appState.isAuthenticating {
                ProgressView()
                    .tint(.appPrimary)
                    .padding(.bottom, 48)
            } else {
                Color.clear.frame(height: 64)
            }
        }
    }

    private func launch() async {
        await appState.signInAnonymously()
        try? await Task.sleep(nanoseconds: 1_200_000_000) // 1.2s minimum splash
        withAnimation(.easeInOut(duration: 0.3)) {
            showHome = true
        }
    }
}

#Preview {
    SplashView().environmentObject(AppState())
}
