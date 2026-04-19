import SwiftUI

struct DareCardView: View {
    let dare: Dare
    let isCompleted: Bool
    var submission: DareSubmission?
    var onTap: (() -> Void)?
    var size: CardSize = .full

    enum CardSize { case full, grid }

    var body: some View {
        Group {
            if isCompleted {
                completedCard
            } else {
                incompleteCard
            }
        }
        .onTapGesture {
            onTap?()
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(dare.text). \(dare.points) points. \(dare.category.displayName). \(isCompleted ? "Completed" : "Not completed")")
    }

    // MARK: - Incomplete Card

    private var incompleteCard: some View {
        ZStack {
            // Background gradient
            Color.categoryGradient(dare.category)

            ZStack(alignment: .topTrailing) {
                // Points badge
                PointsBadge(points: dare.points, size: size == .full ? .large : .medium)
                    .padding(14)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topTrailing)

            // Category chip
            VStack {
                Spacer()
                HStack {
                    CategoryChip(category: dare.category)
                    Spacer()
                }
                .padding(size == .full ? 20 : 12)
            }

            // Dare text
            Text(dare.text)
                .font(.system(size: size == .full ? 26 : 14, weight: .bold, design: .rounded))
                .foregroundColor(.white)
                .multilineTextAlignment(.center)
                .lineSpacing(4)
                .padding(size == .full ? 24 : 12)
                .padding(.top, size == .full ? 44 : 24)
                .padding(.bottom, size == .full ? 60 : 40)
        }
        .background(Color.appSurface)
        .cornerRadius(size == .full ? 24 : 16)
        .shadow(color: .black.opacity(0.25), radius: size == .full ? 12 : 6)
    }

    // MARK: - Completed Card

    private var completedCard: some View {
        ZStack(alignment: .topTrailing) {
            // Media thumbnail as background
            AsyncImage(url: URL(string: submission?.thumbnailUrl ?? "")) { phase in
                switch phase {
                case .success(let img):
                    img.resizable().scaledToFill()
                default:
                    Color.appSurface2
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .clipped()

            // Dark scrim
            LinearGradient.darkOverlay

            // Completed overlay
            completedOverlay
        }
        .background(Color.appSurface2)
        .cornerRadius(size == .full ? 24 : 16)
        .overlay(
            RoundedRectangle(cornerRadius: size == .full ? 24 : 16)
                .stroke(Color.appSuccess.opacity(0.6), lineWidth: 2)
        )
        .shadow(color: .black.opacity(0.3), radius: size == .full ? 12 : 6)
    }

    private var completedOverlay: some View {
        VStack {
            HStack {
                Spacer()
                // Checkmark badge
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: size == .full ? 32 : 20))
                    .foregroundColor(.appSuccess)
                    .padding(12)
            }

            Spacer()

            // Bottom info
            VStack(alignment: .leading, spacing: 4) {
                Text(dare.text)
                    .font(.system(size: size == .full ? 18 : 11, weight: .semibold))
                    .foregroundColor(.white)
                    .lineLimit(2)
                    .shadow(radius: 2)

                HStack {
                    PointsBadge(points: dare.points, size: size == .full ? .medium : .small)
                    if submission?.isVideo == true {
                        Label("Video", systemImage: "video.fill")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundColor(.white)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color.black.opacity(0.4))
                            .cornerRadius(6)
                    }
                }
            }
            .padding(size == .full ? 16 : 10)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.black.opacity(0.3))
        }
    }
}

#Preview("Incomplete") {
    DareCardView(dare: .preview, isCompleted: false)
        .frame(width: 320, height: 440)
        .padding()
}

#Preview("Completed") {
    DareCardView(dare: .preview, isCompleted: true, submission: .preview)
        .frame(width: 320, height: 440)
        .padding()
}
