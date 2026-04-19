import SwiftUI

struct InstructionsView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var currentPage = 0

    private let pages: [InstructionPage] = [
        InstructionPage(
            emoji: "🏠",
            title: "Create or Join",
            body: "One person creates a room and shares the 6-letter code. Everyone else joins in seconds. Up to 20 players per room.",
            tip: "Works best with 4–10 players"
        ),
        InstructionPage(
            emoji: "🤳",
            title: "Set Up Your Profile",
            body: "Enter your name and pick an emoji avatar. Your avatar represents you on the leaderboard throughout the game.",
            tip: "No account needed — just a name"
        ),
        InstructionPage(
            emoji: "⏱️",
            title: "The Host Sets the Timer",
            body: "The host picks a timer from 5 minutes to 2 hours and starts the game. The clock starts for everyone at the same time.",
            tip: "30 or 45 minutes is the sweet spot"
        ),
        InstructionPage(
            emoji: "🎯",
            title: "Complete Dares",
            body: "Swipe through dare cards or browse the grid. Complete dares in the real world and upload photo or video proof to earn points.",
            tip: "Harder dares are worth more points"
        ),
        InstructionPage(
            emoji: "🏆",
            title: "Win the Game",
            body: "The live leaderboard updates in real time. Stack points, watch your rank climb, and outplay everyone before the timer runs out.",
            tip: "Your final score is what counts"
        ),
        InstructionPage(
            emoji: "🎬",
            title: "Get Your Reel",
            body: "When the game ends, everyone gets a personal highlight reel of their completed dares, plus one epic group reel for the whole room.",
            tip: "Share directly to Instagram, TikTok, or anywhere"
        ),
    ]

    var body: some View {
        NavigationStack {
            ZStack {
                Color.appBackground.ignoresSafeArea()

                VStack(spacing: 0) {
                    // Page indicator
                    HStack(spacing: 6) {
                        ForEach(pages.indices, id: \.self) { idx in
                            Capsule()
                                .fill(idx == currentPage ? Color.appPrimary : Color.appBorder)
                                .frame(width: idx == currentPage ? 24 : 6, height: 6)
                                .animation(.spring(response: 0.3), value: currentPage)
                        }
                    }
                    .padding(.top, 8)
                    .padding(.bottom, 24)

                    // Pages
                    TabView(selection: $currentPage) {
                        ForEach(pages.indices, id: \.self) { idx in
                            pageView(pages[idx])
                                .tag(idx)
                        }
                    }
                    .tabViewStyle(.page(indexDisplayMode: .never))

                    // Actions
                    VStack(spacing: 12) {
                        if currentPage < pages.count - 1 {
                            Button("Next") {
                                withAnimation { currentPage += 1 }
                            }
                            .primaryButtonStyle()
                            .padding(.horizontal, 24)
                        } else {
                            Button("Let's Play") { dismiss() }
                                .primaryButtonStyle()
                                .padding(.horizontal, 24)
                        }

                        if currentPage > 0 {
                            Button("Back") {
                                withAnimation { currentPage -= 1 }
                            }
                            .foregroundColor(.appTextSecondary)
                            .font(.system(size: 15))
                        }
                    }
                    .padding(.bottom, 32)
                }
            }
            .navigationTitle("How to Play")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") { dismiss() }
                        .foregroundColor(.appPrimary)
                }
            }
        }
    }

    private func pageView(_ page: InstructionPage) -> some View {
        VStack(spacing: 24) {
            Spacer()

            Text(page.emoji)
                .font(.system(size: 80))

            Text(page.title)
                .font(.system(size: 32, weight: .black, design: .rounded))
                .foregroundColor(.white)
                .multilineTextAlignment(.center)

            Text(page.body)
                .font(.system(size: 17, weight: .regular))
                .foregroundColor(.appTextSecondary)
                .multilineTextAlignment(.center)
                .lineSpacing(5)
                .padding(.horizontal, 32)

            Label(page.tip, systemImage: "lightbulb.fill")
                .font(.system(size: 13, weight: .medium))
                .foregroundColor(.appGold)
                .padding(.horizontal, 20)
                .padding(.vertical, 10)
                .background(Color.appGold.opacity(0.12))
                .cornerRadius(12)

            Spacer()
        }
    }
}

private struct InstructionPage {
    let emoji: String
    let title: String
    let body: String
    let tip: String
}

#Preview {
    InstructionsView()
}
