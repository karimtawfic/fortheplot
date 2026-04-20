import SwiftUI

struct DareCardView: View {
    let dare: Dare
    var submission: DareSubmission?
    var onTap: (() -> Void)?
    var size: CardSize = .full

    enum CardSize { case full, grid }

    private var status: VerificationStatus? { submission?.verificationStatus }

    var body: some View {
        Group {
            switch status {
            case .approved:
                approvedCard
            case .pending:
                pendingCard
            case .needsReview:
                needsReviewCard
            case .rejected:
                rejectedCard
            case .none:
                incompleteCard
            }
        }
        .onTapGesture { onTap?() }
        .accessibilityElement(children: .combine)
        .accessibilityLabel(accessibilityLabel)
    }

    // MARK: - States

    private var incompleteCard: some View {
        ZStack {
            Color.categoryGradient(dare.category)
            ZStack(alignment: .topTrailing) {
                PointsBadge(points: dare.points, size: size == .full ? .large : .medium)
                    .padding(14)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topTrailing)
            VStack {
                Spacer()
                HStack {
                    CategoryChip(category: dare.category)
                    Spacer()
                }
                .padding(size == .full ? 20 : 12)
            }
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

    private var approvedCard: some View {
        ZStack(alignment: .topTrailing) {
            thumbnailBackground(dimAmount: 0.5)
            completedOverlayContent
        }
        .background(Color.appSurface2)
        .cornerRadius(size == .full ? 24 : 16)
        .overlay(
            RoundedRectangle(cornerRadius: size == .full ? 24 : 16)
                .stroke(Color.appSuccess.opacity(0.6), lineWidth: 2)
        )
        .shadow(color: .black.opacity(0.3), radius: size == .full ? 12 : 6)
    }

    private var pendingCard: some View {
        ZStack {
            thumbnailBackground(dimAmount: 0.7)
            VStack(spacing: 8) {
                Text("⏳").font(.system(size: size == .full ? 48 : 28))
                Text("Verifying…")
                    .font(.system(size: size == .full ? 15 : 11, weight: .semibold))
                    .foregroundColor(.white.opacity(0.8))
            }
        }
        .background(Color.appSurface2)
        .cornerRadius(size == .full ? 24 : 16)
        .shadow(color: .black.opacity(0.3), radius: size == .full ? 12 : 6)
    }

    private var needsReviewCard: some View {
        ZStack {
            thumbnailBackground(dimAmount: 0.7)
            VStack(spacing: 8) {
                Text("🕐").font(.system(size: size == .full ? 48 : 28))
                Text("Awaiting host")
                    .font(.system(size: size == .full ? 15 : 11, weight: .semibold))
                    .foregroundColor(.white.opacity(0.8))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 12)
            }
        }
        .background(Color.appSurface2)
        .cornerRadius(size == .full ? 24 : 16)
        .shadow(color: .black.opacity(0.3), radius: size == .full ? 12 : 6)
    }

    private var rejectedCard: some View {
        ZStack {
            thumbnailBackground(dimAmount: 0.75)
            VStack(spacing: 8) {
                Text("✕").font(.system(size: size == .full ? 40 : 24)).foregroundColor(.white.opacity(0.7))
                if let reason = submission?.verificationReason {
                    Text(reason)
                        .font(.system(size: size == .full ? 13 : 10))
                        .foregroundColor(.white.opacity(0.5))
                        .multilineTextAlignment(.center)
                        .lineLimit(2)
                        .padding(.horizontal, 12)
                }
                Text("Tap to retry")
                    .font(.system(size: size == .full ? 13 : 10, weight: .semibold))
                    .foregroundColor(Color.appPrimary)
            }
        }
        .background(Color.appSurface2)
        .cornerRadius(size == .full ? 24 : 16)
        .shadow(color: .black.opacity(0.3), radius: size == .full ? 12 : 6)
    }

    // MARK: - Helpers

    @ViewBuilder
    private func thumbnailBackground(dimAmount: Double) -> some View {
        AsyncImage(url: URL(string: submission?.thumbnailUrl ?? "")) { phase in
            switch phase {
            case .success(let img): img.resizable().scaledToFill()
            default: Color.appSurface2
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .clipped()
        Color.black.opacity(dimAmount)
    }

    private var completedOverlayContent: some View {
        VStack {
            HStack {
                Spacer()
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: size == .full ? 32 : 20))
                    .foregroundColor(.appSuccess)
                    .padding(12)
            }
            Spacer()
            VStack(alignment: .leading, spacing: 4) {
                Text(dare.text)
                    .font(.system(size: size == .full ? 18 : 11, weight: .semibold))
                    .foregroundColor(.white)
                    .lineLimit(2)
                    .shadow(radius: 2)
                HStack {
                    PointsBadge(points: submission?.pointsAwarded ?? dare.points, size: size == .full ? .medium : .small)
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

    private var accessibilityLabel: String {
        let stateLabel: String
        switch status {
        case .approved: stateLabel = "Completed"
        case .pending: stateLabel = "Verifying"
        case .needsReview: stateLabel = "Awaiting host review"
        case .rejected: stateLabel = "Rejected, tap to retry"
        case .none: stateLabel = "Not attempted"
        }
        return "\(dare.text). \(dare.points) points. \(dare.category.displayName). \(stateLabel)"
    }
}

#Preview("Incomplete") {
    DareCardView(dare: .preview)
        .frame(width: 320, height: 440).padding()
}
#Preview("Approved") {
    DareCardView(dare: .preview, submission: .preview)
        .frame(width: 320, height: 440).padding()
}
#Preview("Needs Review") {
    DareCardView(dare: .preview, submission: .previewPending)
        .frame(width: 320, height: 440).padding()
}
