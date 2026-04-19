import SwiftUI
import AVKit
import Photos

struct ReelPreviewView: View {
    let job: ReelJob

    @State private var player: AVPlayer?
    @State private var showSaveAlert = false
    @State private var saveMessage = ""
    @Environment(\.dismiss) private var dismiss

    var title: String {
        job.type == .personal ? "Your Reel" : "Group Reel"
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.black.ignoresSafeArea()

                if let outputUrl = job.outputUrl, let url = URL(string: outputUrl) {
                    VideoPlayer(player: AVPlayer(url: url))
                        .ignoresSafeArea()
                        .onAppear {
                            let p = AVPlayer(url: url)
                            player = p
                            p.play()
                        }
                        .onDisappear {
                            player?.pause()
                            player = nil
                        }
                } else {
                    VStack(spacing: 16) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .font(.system(size: 48))
                            .foregroundColor(.orange)
                        Text("Reel not available")
                            .foregroundColor(.white)
                    }
                }

                // Bottom share bar
                VStack {
                    Spacer()
                    shareBar
                }
            }
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") { dismiss() }
                        .foregroundColor(.appPrimary)
                }
            }
        }
        .alert(saveMessage, isPresented: $showSaveAlert) {
            Button("OK") {}
        }
    }

    private var shareBar: some View {
        HStack(spacing: 20) {
            // Share native
            if let urlString = job.outputUrl, let url = URL(string: urlString) {
                ShareLink(item: url, subject: Text(title), message: Text("Check out my Out & About reel!")) {
                    VStack(spacing: 4) {
                        Image(systemName: "square.and.arrow.up")
                            .font(.system(size: 22))
                            .foregroundColor(.white)
                        Text("Share")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundColor(.white.opacity(0.7))
                    }
                }
            }

            // Save to Photos
            Button {
                saveToPhotos()
            } label: {
                VStack(spacing: 4) {
                    Image(systemName: "arrow.down.circle.fill")
                        .font(.system(size: 22))
                        .foregroundColor(.appGold)
                    Text("Save")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(.appGold)
                }
            }
            .accessibilityLabel("Save reel to Photos")

            // Instagram
            Button {
                if let url = URL(string: "instagram://app"), UIApplication.shared.canOpenURL(url) {
                    UIApplication.shared.open(url)
                }
            } label: {
                VStack(spacing: 4) {
                    Image(systemName: "camera.filters")
                        .font(.system(size: 22))
                        .foregroundColor(.white)
                    Text("Instagram")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(.white.opacity(0.7))
                }
            }
        }
        .padding(.horizontal, 32)
        .padding(.vertical, 20)
        .frame(maxWidth: .infinity)
        .background(Color.black.opacity(0.7))
    }

    private func saveToPhotos() {
        guard let urlString = job.outputUrl, let url = URL(string: urlString) else { return }
        PHPhotoLibrary.shared().performChanges({
            PHAssetChangeRequest.creationRequestForAssetFromVideo(atFileURL: url)
        }) { success, _ in
            DispatchQueue.main.async {
                saveMessage = success ? "Reel saved to Photos!" : "Save failed."
                showSaveAlert = true
            }
        }
    }
}

#Preview {
    ReelPreviewView(job: .previewComplete)
}
