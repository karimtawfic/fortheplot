import Foundation
import FirebaseFirestore

struct Dare: Identifiable, Equatable {
    @DocumentID var documentId: String?
    var dareId: String
    var text: String
    var points: Int
    var category: DareCategory
    var active: Bool
    var repeatable: Bool
    var verificationMode: VerificationMode
    var difficulty: DareDifficulty
    var createdAt: Date?
    var updatedAt: Date?

    var id: String { dareId }
}

extension Dare: Codable {
    enum CodingKeys: String, CodingKey {
        case documentId
        case dareId, text, points, category, active
        case repeatable, verificationMode, difficulty
        case createdAt, updatedAt
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        documentId = try c.decodeIfPresent(String.self, forKey: .documentId)
        dareId = try c.decode(String.self, forKey: .dareId)
        text = try c.decode(String.self, forKey: .text)
        points = try c.decode(Int.self, forKey: .points)
        category = try c.decode(DareCategory.self, forKey: .category)
        active = try c.decode(Bool.self, forKey: .active)
        // New fields with safe defaults for old documents
        repeatable = (try? c.decode(Bool.self, forKey: .repeatable)) ?? false
        verificationMode = (try? c.decode(VerificationMode.self, forKey: .verificationMode)) ?? .mediaRequired
        difficulty = (try? c.decode(DareDifficulty.self, forKey: .difficulty)) ?? .medium
        createdAt = try? c.decode(Date.self, forKey: .createdAt)
        updatedAt = try? c.decode(Date.self, forKey: .updatedAt)
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

enum VerificationMode: String, Codable {
    case none
    case mediaRequired = "media_required"
    case aiCheck = "ai_check"
    case adminReview = "admin_review"
}

enum DareDifficulty: String, Codable {
    case easy
    case medium
    case hard
    case wild

    var label: String {
        switch self {
        case .easy: return "Easy"
        case .medium: return "Medium"
        case .hard: return "Hard"
        case .wild: return "Wild!"
        }
    }
}

extension Dare {
    static var preview: Dare {
        Dare(
            dareId: "dare_001",
            text: "Get a complete stranger to high-five you",
            points: 20,
            category: .social,
            active: true,
            repeatable: false,
            verificationMode: .mediaRequired,
            difficulty: .easy
        )
    }

    static var previewDares: [Dare] {
        [
            Dare(dareId: "d1", text: "Get a complete stranger to high-five you", points: 20, category: .social, active: true, repeatable: false, verificationMode: .mediaRequired, difficulty: .easy),
            Dare(dareId: "d2", text: "Do 10 jumping jacks in a public place", points: 30, category: .physical, active: true, repeatable: false, verificationMode: .mediaRequired, difficulty: .easy),
            Dare(dareId: "d3", text: "Draw a portrait of a teammate in under 2 minutes", points: 50, category: .creative, active: true, repeatable: false, verificationMode: .mediaRequired, difficulty: .medium),
            Dare(dareId: "d4", text: "Order something you have never tried before", points: 30, category: .food, active: true, repeatable: false, verificationMode: .mediaRequired, difficulty: .easy),
            Dare(dareId: "d5", text: "Find the tallest staircase nearby and climb it", points: 50, category: .physical, active: true, repeatable: false, verificationMode: .mediaRequired, difficulty: .medium),
            Dare(dareId: "d6", text: "Find a water reflection and photograph something in it", points: 45, category: .outdoor, active: true, repeatable: false, verificationMode: .mediaRequired, difficulty: .medium),
        ]
    }
}
