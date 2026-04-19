import SwiftUI
import AVKit
import Photos

struct FullScreenCardView: View {
    let submission: DareSubmission
    let players: [Player]

    @Environment(\.dismiss) private var dismiss
    @State private var player: AVPlayer?
    @State private var showSaveAlert = false
    @State private var saveMessage = ""

    var playerForSubmission: Player? {
        players.first { $0.playerId == submission.playerId }
    }

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            // Media
            mediaContent
                .ignoresSafeArea()

            // UI overlay
            VStack {
                topBar
                Spacer()
                bottomPanel
            }
        }
        .statusBarHidden(true)
        .onDisappear {
            player?.pause()
            player = nil
        }
    }

    // MARK: - Media

    @ViewBuilder
    private var mediaContent: some View {
        if submission.isVideo, let url = URL(string: submission.mediaUrl) {
            VideoPlayer(player: AVPlayer(url: url))
                .onAppear {
                    let p = AVPlayer(url: url)
                    player = p
                    p.play()
                }
        } else {
            AsyncImage(url: URL(string: submission.mediaUrl)) { phase in
                switch phase {
                case .success(let img):
                    img.resizable().scaledToFill()
                default:
                    Color.appSurface2
                        .overlay(ProgressView().tint(.white))
                }
            }
        }
    }

    // MARK: - Top Bar

    private var topBar: some View {
        HStack {
            Button { dismiss() } label: {
                Image(systemName: "xmark.circle.fill")
                    .font(.system(size: 32))
                    .foregroundColor(.white.opacity(0.85))
                    .shadow(radius: 4)
            }
            .accessibilityLabel("Close")

            Spacer()

            if let p = playerForSubmission {
                HStack(spacing: 8) {
                    Text(p.avatarEmoji)
                        .font(.system(size: 20))
                    Text(p.displayName)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(.white)
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 8)
                .background(Color.black.opacity(0.4))
                .cornerRadius(20)
            }
        }
        .padding(20)
        .padding(.top, 8)
    }

    // MARK: - Bottom Panel

    private var bottomPanel: some View {
        VStack(spacing: 0) {
            LinearGradient(
                colors: [Color.black.opacity(0), Color.black.opacity(0.85)],
                startPoint: .top,
                endPoint: .bottom
            )
            .frame(height: 80)

            VStack(alignment: .leading, spacing: 12) {
                // Dare text + points
                HStack(alignment: .top, spacing: 12) {
                    Text(submission.dareTextSnapshot)
                        .font(.system(size: 18, weight: .bold))
                        .foregroundColor(.white)
                        .lineSpacing(3)
                        .frame(maxWidth: .infinity, alignment: .leading)

                    PointsBadge(points: submission.pointsAwarded, size: .medium)
                        .flexibleFrame()
                }

                Divider().background(Color.white.opacity(0.2))

                // Share actions
                HStack(spacing: 16) {
                    shareButton(icon: "Instagram", systemIcon: "camera.filters", action: shareToInstagram)
                    shareButton(icon: "TikTok", systemIcon: "music.note", action: shareToTikTok)
                    shareButton(icon: "Share", systemIcon: "square.and.arrow.up", action: shareNative)
                    Spacer()
                    saveButton
                }
            }
            .padding(20)
            .background(Color.black.opacity(0.85))
        }
    }

    private func shareButton(icon: String, systemIcon: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Image(systemName: systemIcon)
                    .font(.system(size: 20))
                    .foregroundColor(.white)
                Text(icon)
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundColor(.white.opacity(0.7))
            }
        }
        .accessibilityLabel("Share to \(icon)")
    }

    private var saveButton: some View {
        Button {
            saveToPhotos()
        } label: {
            VStack(spacing: 4) {
                Image(systemName: "arrow.down.circle.fill")
                    .font(.system(size: 22))
                    .foregroundColor(.appGold)
                Text("Save")
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundColor(.appGold)
            }
        }
        .accessibilityLabel("Save to camera roll")
        .alert(saveMessage, isPresented: $showSaveAlert) {
            Button("OK") {}
        }
    }

    // MARK: - Share Actions

    private func shareToInstagram() {
        if let url = URL(string: "instagram://app"), UIApplication.shared.canOpenURL(url) {
            UIApplication.shared.open(url)
        } else {
            shareNative()
        }
    }

    private func shareToTikTok() {
        if let url = URL(string: "tiktok://"), UIApplication.shared.canOpenURL(url) {
            UIApplication.shared.open(url)
        } else {
            shareNative()
        }
    }

    private func shareNative() {
        guard let url = URL(string: submission.mediaUrl) else { return }
        let items: [Any] = [url, submission.dareTextSnapshot]
        let controller = UIActivityViewController(activityItems: items, applicationActivities: nil)
        UIApplication.shared.firstKeyWindow?.rootViewController?
            .present(controller, animated: true)
    }

    private func saveToPhotos() {
        guard let url = URL(string: submission.mediaUrl) else { return }
        if submission.isPhoto {
            URLSession.shared.dataTask(with: url) { data, _, _ in
                guard let data, let image = UIImage(data: data) else { return }
                PHPhotoLibrary.shared().performChanges({
                    PHAssetChangeRequest.creationRequestForAsset(from: image)
                }) { success, _ in
                    DispatchQueue.main.async {
                        saveMessage = success ? "Saved to Photos!" : "Save failed."
                        showSaveAlert = true
                    }
                }
            }.resume()
        } else {
            PHPhotoLibrary.shared().performChanges({
                PHAssetChangeRequest.creationRequestForAssetFromVideo(atFileURL: url)
            }) { success, _ in
                DispatchQueue.main.async {
                    saveMessage = success ? "Video saved to Photos!" : "Save failed."
                    showSaveAlert = true
                }
            }
        }
    }
}

extension View {
    func flexibleFrame() -> some View {
        self.fixedSize()
    }
}

extension UIApplication {
    var firstKeyWindow: UIWindow? {
        connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
            .first { $0.isKeyWindow }
    }
}

#Preview {
    FullScreenCardView(submission: .preview, players: Player.previewPlayers)
}
