import SwiftUI

extension Color {
    // ─── App Palette ──────────────────────────────────────────────────────────
    static let appBackground    = Color(hex: "#0D0D1A")
    static let appSurface       = Color(hex: "#1A1A2E")
    static let appSurface2      = Color(hex: "#16213E")
    static let appPrimary       = Color(hex: "#FF6B35")
    static let appAccent        = Color(hex: "#E94560")
    static let appGold          = Color(hex: "#FFD700")
    static let appSuccess       = Color(hex: "#4CAF50")
    static let appText          = Color.white
    static let appTextSecondary = Color(hex: "#AAAACC")
    static let appBorder        = Color(hex: "#2A2A4A")

    // ─── Category Colors ──────────────────────────────────────────────────────
    static func categoryColor(_ category: DareCategory) -> Color {
        switch category {
        case .social:   return Color(hex: "#4FC3F7")
        case .physical: return Color(hex: "#FF8A65")
        case .creative: return Color(hex: "#CE93D8")
        case .food:     return Color(hex: "#FFF176")
        case .outdoor:  return Color(hex: "#A5D6A7")
        }
    }

    static func categoryGradient(_ category: DareCategory) -> LinearGradient {
        let base = categoryColor(category)
        return LinearGradient(
            colors: [base.opacity(0.3), Color.appSurface],
            startPoint: .top,
            endPoint: .bottom
        )
    }

    // ─── Hex initializer ─────────────────────────────────────────────────────
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: .alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r, g, b, a: UInt64
        switch hex.count {
        case 6:
            (r, g, b, a) = (int >> 16, int >> 8 & 0xFF, int & 0xFF, 255)
        case 8:
            (r, g, b, a) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (r, g, b, a) = (0, 0, 0, 255)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

// MARK: - Gradient Presets

extension LinearGradient {
    static let appHeroGradient = LinearGradient(
        colors: [Color(hex: "#FF6B35"), Color(hex: "#E94560")],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let appCardGradient = LinearGradient(
        colors: [Color.appSurface, Color.appSurface2],
        startPoint: .top,
        endPoint: .bottom
    )

    static let darkOverlay = LinearGradient(
        colors: [Color.black.opacity(0), Color.black.opacity(0.8)],
        startPoint: .top,
        endPoint: .bottom
    )
}
