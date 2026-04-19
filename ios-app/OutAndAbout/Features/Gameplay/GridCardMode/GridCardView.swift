import SwiftUI

struct GridCardView: View {
    @ObservedObject var viewModel: GameplayViewModel
    @State private var selectedFullScreenDare: Dare?
    @State private var gridPage = 0

    private let columns = [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)]
    private let cardsPerPage = 6

    var totalPages: Int {
        max(1, Int(ceil(Double(viewModel.dares.count) / Double(cardsPerPage))))
    }

    var daresForPage: [Dare] {
        let start = gridPage * cardsPerPage
        let end = min(start + cardsPerPage, viewModel.dares.count)
        guard start < end else { return [] }
        return Array(viewModel.dares[start..<end])
    }

    var body: some View {
        VStack(spacing: 0) {
            // Horizontal pager
            TabView(selection: $gridPage) {
                ForEach(0..<totalPages, id: \.self) { page in
                    gridPageView(page: page)
                        .tag(page)
                }
            }
            .tabViewStyle(.page(indexDisplayMode: .never))

            // Page indicator
            HStack(spacing: 6) {
                ForEach(0..<totalPages, id: \.self) { page in
                    Capsule()
                        .fill(page == gridPage ? Color.appPrimary : Color.appBorder)
                        .frame(width: page == gridPage ? 20 : 6, height: 6)
                        .animation(.spring(response: 0.3), value: gridPage)
                }
            }
            .padding(.vertical, 8)
        }
        .sheet(item: $selectedFullScreenDare) { dare in
            FullScreenDareSheet(
                dare: dare,
                isCompleted: viewModel.isAlreadyCompleted(dare),
                submission: viewModel.allSubmissions.first { $0.dareId == dare.dareId },
                onComplete: {
                    selectedFullScreenDare = nil
                    viewModel.selectDareForProof(dare)
                }
            )
        }
    }

    private func gridPageView(page: Int) -> some View {
        let start = page * cardsPerPage
        let end = min(start + cardsPerPage, viewModel.dares.count)
        let pageDares = start < end ? Array(viewModel.dares[start..<end]) : []

        return ScrollView(showsIndicators: false) {
            LazyVGrid(columns: columns, spacing: 12) {
                ForEach(pageDares) { dare in
                    let completed = viewModel.isAlreadyCompleted(dare)
                    let submission = viewModel.allSubmissions.first { $0.dareId == dare.dareId }

                    DareCardView(
                        dare: dare,
                        isCompleted: completed,
                        submission: submission,
                        onTap: {
                            UIImpactFeedbackGenerator(style: .light).impactOccurred()
                            selectedFullScreenDare = dare
                        },
                        size: .grid
                    )
                    .aspectRatio(0.7, contentMode: .fit)
                }
            }
            .padding(16)
        }
    }
}

// Lightweight full-screen card sheet opened from grid
struct FullScreenDareSheet: View {
    let dare: Dare
    let isCompleted: Bool
    var submission: DareSubmission?
    var onComplete: () -> Void

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ZStack {
            Color.appBackground.ignoresSafeArea()

            VStack(spacing: 0) {
                HStack {
                    Spacer()
                    Button { dismiss() } label: {
                        Image(systemName: "xmark.circle.fill")
                            .font(.system(size: 28))
                            .foregroundColor(.appTextSecondary)
                    }
                }
                .padding(20)

                DareCardView(
                    dare: dare,
                    isCompleted: isCompleted,
                    submission: submission,
                    size: .full
                )
                .padding(.horizontal, 24)

                Spacer()

                if !isCompleted {
                    Button {
                        onComplete()
                    } label: {
                        Label("Complete This Dare", systemImage: "camera.fill")
                    }
                    .primaryButtonStyle()
                    .padding(.horizontal, 24)
                    .padding(.bottom, 40)
                } else {
                    Text("✅ Dare completed!")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.appSuccess)
                        .padding(.bottom, 40)
                }
            }
        }
    }
}
