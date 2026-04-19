import SwiftUI

// MARK: - Button Styles

struct PrimaryButtonStyle: ViewModifier {
    var isLoading: Bool = false
    var isDisabled: Bool = false

    func body(content: Content) -> some View {
        content
            .font(.system(size: 18, weight: .bold))
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .frame(height: 56)
            .background(
                Group {
                    if isDisabled {
                        Color.appBorder
                    } else {
                        LinearGradient.appHeroGradient
                    }
                }
            )
            .cornerRadius(16)
            .overlay(
                Group {
                    if isLoading {
                        ProgressView()
                            .tint(.white)
                    }
                }
            )
            .animation(.easeInOut(duration: 0.2), value: isLoading)
    }
}

struct SecondaryButtonStyle: ViewModifier {
    func body(content: Content) -> some View {
        content
            .font(.system(size: 16, weight: .semibold))
            .foregroundColor(.appPrimary)
            .frame(maxWidth: .infinity)
            .frame(height: 52)
            .background(Color.appSurface)
            .cornerRadius(16)
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(Color.appPrimary.opacity(0.5), lineWidth: 1.5)
            )
    }
}

// MARK: - Card Style

struct CardStyle: ViewModifier {
    var cornerRadius: CGFloat = 20
    var shadowRadius: CGFloat = 12

    func body(content: Content) -> some View {
        content
            .background(Color.appSurface)
            .cornerRadius(cornerRadius)
            .shadow(color: Color.black.opacity(0.3), radius: shadowRadius, x: 0, y: 4)
    }
}

// MARK: - Error Alert

struct ErrorAlertModifier: ViewModifier {
    @Binding var error: String?

    func body(content: Content) -> some View {
        content.alert("Something went wrong", isPresented: .init(
            get: { error != nil },
            set: { if !$0 { error = nil } }
        )) {
            Button("OK") { error = nil }
        } message: {
            if let error { Text(error) }
        }
    }
}

// MARK: - Loading Overlay

struct LoadingOverlayModifier: ViewModifier {
    var isLoading: Bool
    var message: String?

    func body(content: Content) -> some View {
        ZStack {
            content
                .disabled(isLoading)

            if isLoading {
                Color.black.opacity(0.5)
                    .ignoresSafeArea()
                VStack(spacing: 16) {
                    ProgressView()
                        .scaleEffect(1.5)
                        .tint(.appPrimary)
                    if let message {
                        Text(message)
                            .font(.system(size: 15, weight: .medium))
                            .foregroundColor(.white)
                    }
                }
                .padding(32)
                .background(Color.appSurface)
                .cornerRadius(20)
            }
        }
        .animation(.easeInOut(duration: 0.2), value: isLoading)
    }
}

// MARK: - View Extensions

extension View {
    func primaryButtonStyle(isLoading: Bool = false, isDisabled: Bool = false) -> some View {
        modifier(PrimaryButtonStyle(isLoading: isLoading, isDisabled: isDisabled))
    }

    func secondaryButtonStyle() -> some View {
        modifier(SecondaryButtonStyle())
    }

    func cardStyle(cornerRadius: CGFloat = 20, shadowRadius: CGFloat = 12) -> some View {
        modifier(CardStyle(cornerRadius: cornerRadius, shadowRadius: shadowRadius))
    }

    func errorAlert(error: Binding<String?>) -> some View {
        modifier(ErrorAlertModifier(error: error))
    }

    func loadingOverlay(isLoading: Bool, message: String? = nil) -> some View {
        modifier(LoadingOverlayModifier(isLoading: isLoading, message: message))
    }

    func hapticFeedback(_ style: UIImpactFeedbackGenerator.FeedbackStyle = .medium) -> some View {
        self.onTapGesture {
            UIImpactFeedbackGenerator(style: style).impactOccurred()
        }
    }
}

// MARK: - Points Badge

struct PointsBadge: View {
    let points: Int
    var size: BadgeSize = .medium

    enum BadgeSize {
        case small, medium, large
        var fontSize: CGFloat {
            switch self {
            case .small: return 12
            case .medium: return 16
            case .large: return 22
            }
        }
        var padding: CGFloat {
            switch self {
            case .small: return 6
            case .medium: return 10
            case .large: return 14
            }
        }
    }

    var body: some View {
        Text("+\(points)")
            .font(.system(size: size.fontSize, weight: .black))
            .foregroundColor(.appBackground)
            .padding(.horizontal, size.padding)
            .padding(.vertical, size.padding / 2)
            .background(Color.appGold)
            .cornerRadius(100)
    }
}

// MARK: - Category Chip

struct CategoryChip: View {
    let category: DareCategory

    var body: some View {
        HStack(spacing: 4) {
            Text(category.emoji)
                .font(.caption)
            Text(category.displayName)
                .font(.system(size: 11, weight: .semibold))
                .foregroundColor(Color.categoryColor(category))
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 5)
        .background(Color.categoryColor(category).opacity(0.15))
        .cornerRadius(100)
        .overlay(
            Capsule().stroke(Color.categoryColor(category).opacity(0.4), lineWidth: 1)
        )
    }
}
