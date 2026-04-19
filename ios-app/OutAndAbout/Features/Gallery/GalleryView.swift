import SwiftUI

struct GalleryView: View {
    let submissions: [DareSubmission]
    let players: [Player]
    let currentPlayerId: String

    @State private var filter: GalleryFilter = .all
    @State private var selectedSubmission: DareSubmission?

    enum GalleryFilter: String, CaseIterable {
        case all = "All"
        case mine = "Mine"
    }

    private let columns = [GridItem(.flexible(), spacing: 2), GridItem(.flexible(), spacing: 2)]

    var filteredSubmissions: [DareSubmission] {
        switch filter {
        case .all: return submissions
        case .mine: return submissions.filter { $0.playerId == currentPlayerId }
        }
    }

    var body: some View {
        ZStack {
            Color.appBackground.ignoresSafeArea()

            VStack(spacing: 0) {
                filterBar
                if filteredSubmissions.isEmpty {
                    emptyState
                } else {
                    grid
                }
            }
        }
        .sheet(item: $selectedSubmission) { sub in
            FullScreenCardView(submission: sub, players: players)
        }
    }

    private var filterBar: some View {
        HStack(spacing: 0) {
            ForEach(GalleryFilter.allCases, id: \.self) { f in
                Button {
                    withAnimation(.spring(response: 0.3)) { filter = f }
                } label: {
                    Text(f.rawValue)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(filter == f ? .white : .appTextSecondary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(filter == f ? Color.appPrimary : Color.clear)
                        .cornerRadius(10)
                }
            }
        }
        .padding(4)
        .background(Color.appSurface)
        .cornerRadius(14)
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
    }

    private var grid: some View {
        ScrollView {
            LazyVGrid(columns: columns, spacing: 2) {
                ForEach(filteredSubmissions) { sub in
                    galleryCell(sub)
                }
            }
        }
    }

    private func galleryCell(_ sub: DareSubmission) -> some View {
        let player = players.first { $0.playerId == sub.playerId }

        return Button {
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
            selectedSubmission = sub
        } label: {
            ZStack(alignment: .bottomLeading) {
                AsyncImage(url: URL(string: sub.thumbnailUrl)) { phase in
                    switch phase {
                    case .success(let img):
                        img.resizable().scaledToFill()
                    default:
                        Color.appSurface2
                            .overlay(
                                Image(systemName: sub.isVideo ? "video.fill" : "photo.fill")
                                    .foregroundColor(.appTextSecondary)
                            )
                    }
                }
                .aspectRatio(1, contentMode: .fill)
                .clipped()

                // Overlay
                VStack(alignment: .leading, spacing: 2) {
                    if sub.isVideo {
                        Image(systemName: "play.fill")
                            .font(.system(size: 12))
                            .foregroundColor(.white)
                            .padding(4)
                            .background(Color.black.opacity(0.5))
                            .cornerRadius(4)
                    }
                    Spacer()
                    HStack {
                        Text(player?.avatarEmoji ?? "👤")
                            .font(.caption)
                        Text("+\(sub.pointsAwarded)")
                            .font(.system(size: 11, weight: .black))
                            .foregroundColor(.appGold)
                    }
                    .padding(.horizontal, 6)
                    .padding(.vertical, 4)
                    .background(Color.black.opacity(0.5))
                }
                .padding(4)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomLeading)
            }
        }
        .accessibilityLabel("Submission by \(player?.displayName ?? "Unknown"): \(sub.dareTextSnapshot). \(sub.pointsAwarded) points.")
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Spacer()
            Image(systemName: "photo.on.rectangle.angled")
                .font(.system(size: 48))
                .foregroundColor(.appTextSecondary)
            Text("No submissions yet")
                .font(.system(size: 18, weight: .semibold))
                .foregroundColor(.appTextSecondary)
            Spacer()
        }
    }
}

#Preview {
    GalleryView(
        submissions: [.preview, .previewVideo],
        players: Player.previewPlayers,
        currentPlayerId: "preview-player-1"
    )
}
