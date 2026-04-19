import Foundation

struct ReelAsset: Identifiable, Equatable {
    var id: String { submissionId }
    var submissionId: String
    var playerId: String
    var playerName: String
    var dareText: String
    var points: Int
    var mediaType: MediaType
    var mediaUrl: String
    var thumbnailUrl: String
    var capturedAt: Date
}
