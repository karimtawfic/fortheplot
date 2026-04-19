import SwiftUI

struct SingleCardView: View {
    @ObservedObject var viewModel: GameplayViewModel

    var body: some View {
        GeometryReader { geo in
            TabView(selection: $viewModel.currentCardIndex) {
                ForEach(viewModel.dares.indices, id: \.self) { idx in
                    let dare = viewModel.dares[idx]
                    let completed = viewModel.isAlreadyCompleted(dare)
                    let submission = viewModel.allSubmissions.first { $0.dareId == dare.dareId }

                    DareCardView(
                        dare: dare,
                        isCompleted: completed,
                        submission: submission,
                        onTap: {
                            if !completed {
                                viewModel.selectDareForProof(dare)
                            } else {
                                // Show full-screen completed card
                                viewModel.selectedDare = dare
                            }
                        },
                        size: .full
                    )
                    .padding(.horizontal, 20)
                    .frame(width: geo.size.width, height: geo.size.height)
                    .tag(idx)
                }
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
        }
        .overlay(alignment: .bottom) {
            if !viewModel.dares.isEmpty {
                swipeHint
                    .padding(.bottom, 16)
            }
        }
    }

    private var swipeHint: some View {
        HStack(spacing: 4) {
            Image(systemName: "chevron.left")
                .font(.system(size: 12, weight: .bold))
                .foregroundColor(.appTextSecondary.opacity(0.6))
            Text("\(viewModel.currentCardIndex + 1) of \(viewModel.dares.count)")
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(.appTextSecondary)
            Image(systemName: "chevron.right")
                .font(.system(size: 12, weight: .bold))
                .foregroundColor(.appTextSecondary.opacity(0.6))
        }
    }
}
