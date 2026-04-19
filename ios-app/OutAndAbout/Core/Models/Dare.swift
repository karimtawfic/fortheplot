import Foundation
import FirebaseFirestore

struct Dare: Codable, Identifiable, Equatable {
    @DocumentID var documentId: String?
    var dareId: String
    var text: String
    var points: Int
    var category: DareCategory
    var active: Bool

    var id: String { dareId }

    enum CodingKeys: String, CodingKey {
        case documentId
        case dareId, text, points, category, active
    }
}

enum DareCategory: String, Codable, CaseIterable {
    case social
    case physical
    case creative
    case food
    case outdoor

    var displayName: String {
        switch self {
        case .social: return "Social"
        case .physical: return "Physical"
        case .creative: return "Creative"
        case .food: return "Food"
        case .outdoor: return "Outdoor"
        }
    }

    var emoji: String {
        switch self {
        case .social: return "🤝"
        case .physical: return "💪"
        case .creative: return "🎨"
        case .food: return "🍕"
        case .outdoor: return "🌿"
        }
    }
}

extension Dare {
    static var preview: Dare {
        Dare(dareId: "dare_001", text: "Get a complete stranger to high-five you", points: 20, category: .social, active: true)
    }

    static var previewDares: [Dare] {
        [
            Dare(dareId: "d1", text: "Get a complete stranger to high-five you", points: 20, category: .social, active: true),
            Dare(dareId: "d2", text: "Do 10 jumping jacks in a public place", points: 30, category: .physical, active: true),
            Dare(dareId: "d3", text: "Draw a portrait of a teammate in under 2 minutes", points: 50, category: .creative, active: true),
            Dare(dareId: "d4", text: "Order something you have never tried before", points: 30, category: .food, active: true),
            Dare(dareId: "d5", text: "Find the tallest staircase nearby and climb it", points: 50, category: .physical, active: true),
            Dare(dareId: "d6", text: "Find a water reflection and photograph something in it", points: 45, category: .outdoor, active: true),
        ]
    }
}
