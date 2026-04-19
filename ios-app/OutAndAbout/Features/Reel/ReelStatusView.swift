import SwiftUI

struct ReelStatusView: View {
    let roomId: String
    let isPersonal: Bool

    @EnvironmentObject var appState: AppState
    @StateObject private var viewModel = ReelViewModel()
    @Environment(\.dismiss) private var dismiss

    var job: ReelJob? { isPersonal ? viewModel.personalJob : viewModel.groupJob }
    var isLoading: Bool { isPersonal ? viewModel.isLoadingPersonal : viewModel.isLoadingGroup }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.appBackground.ignoresSafeArea()

                VStack(spacing: 32) {
                    Spacer()
                    statusIcon
                    statusText
                    if let j = job, j.isComplete {
                        NavigationLink {
                            ReelPreviewView(job: j)
                        } label: {
                            Label("Watch Your Reel", systemImage: "play.fill")
                        }
                        .primaryButtonStyle()
                        .padding(.horizontal, 40)
                    }
                    Spacer()
                }
            }
            .navigationTitle(isPersonal ? "Your Reel" : "Group Reel")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Close") { dismiss() }
                        .foregroundColor(.appPrimary)
                }
            }
            .onAppear {
                let pid = appState.currentPlayer?.playerId ?? AuthService.shared.currentUID ?? ""
                viewModel.startListening(roomId: roomId, playerId: pid)
            }
            .onDisappear {
                viewModel.stopListening()
            }
        }
    }

    @ViewBuilder
    private var statusIcon: some View {
        if isLoading {
            ProgressView()
                .scaleEffect(2)
                .tint(.appPrimary)
        } else if let j = job {
            switch j.status {
            case .queued, .processing:
                ZStack {
                    Circle()
                        .stroke(Color.appBorder, lineWidth: 4)
                        .frame(width: 80, height: 80)
                    Circle()
                        .trim(from: 0, to: 0.7)
                        .stroke(Color.appPrimary, style: StrokeStyle(lineWidth: 4, lineCap: .round))
                        .frame(width: 80, height: 80)
                        .rotationEffect(.degrees(-90))
                        .animation(.linear(duration: 1).repeatForever(autoreverses: false), value: j.status)
                    Image(systemName: "film.fill")
                        .font(.system(size: 28))
                        .foregroundColor(.appPrimary)
                }
            case .complete:
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 80))
                    .foregroundColor(.appSuccess)
            case .failed:
                Image(systemName: "exclamationmark.circle.fill")
                    .font(.system(size: 80))
                    .foregroundColor(.red)
            }
        } else {
            Image(systemName: "clock.fill")
                .font(.system(size: 60))
                .foregroundColor(.appTextSecondary)
        }
    }

    @ViewBuilder
    private var statusText: some View {
        VStack(spacing: 10) {
            if isLoading {
                Text("Looking for your reel…")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(.white)
            } else if let j = job {
                switch j.status {
                case .queued:
                    Text("In Queue")
                        .font(.system(size: 24, weight: .black))
                        .foregroundColor(.white)
                    Text("Your reel is queued for rendering.")
                        .foregroundColor(.appTextSecondary)
                        .multilineTextAlignment(.center)
                case .processing:
                    Text("Assembling Your Reel")
                        .font(.system(size: 24, weight: .black))
                        .foregroundColor(.white)
                    Text("This usually takes 1–3 minutes.\nHang tight!")
                        .foregroundColor(.appTextSecondary)
                        .multilineTextAlignment(.center)
                case .complete:
                    Text("Your Reel is Ready! 🎬")
                        .font(.system(size: 24, weight: .black))
                        .foregroundStyle(LinearGradient.appHeroGradient)
                    Text("Tap below to watch and share.")
                        .foregroundColor(.appTextSecondary)
                case .failed:
                    Text("Reel Generation Failed")
                        .font(.system(size: 24, weight: .black))
                        .foregroundColor(.red)
                    Text(j.errorMessage ?? "Something went wrong. Please try again.")
                        .foregroundColor(.appTextSecondary)
                        .multilineTextAlignment(.center)
                }
            }
        }
        .padding(.horizontal, 32)
    }
}
