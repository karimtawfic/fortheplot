import SwiftUI

struct CreateRoomView: View {
    @EnvironmentObject var appState: AppState
    @StateObject private var viewModel = CreateRoomViewModel()
    @Binding var path: NavigationPath
    @FocusState private var nameFocused: Bool

    var body: some View {
        ZStack {
            Color.appBackground.ignoresSafeArea()

            ScrollView(showsIndicators: false) {
                VStack(spacing: 28) {
                    // Name
                    VStack(alignment: .leading, spacing: 8) {
                        Label("Your Name", systemImage: "person.fill")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(.appTextSecondary)
                            .textCase(.uppercase)
                            .tracking(1)

                        TextField("Enter your name...", text: $viewModel.displayName)
                            .font(.system(size: 18, weight: .medium))
                            .foregroundColor(.white)
                            .padding(16)
                            .background(Color.appSurface)
                            .cornerRadius(14)
                            .overlay(
                                RoundedRectangle(cornerRadius: 14)
                                    .stroke(nameFocused ? Color.appPrimary : Color.appBorder, lineWidth: 1.5)
                            )
                            .focused($nameFocused)
                            .submitLabel(.done)
                            .onSubmit { nameFocused = false }
                            .accessibilityLabel("Your display name")
                    }

                    // Emoji Picker
                    VStack(alignment: .leading, spacing: 12) {
                        Label("Pick Your Avatar", systemImage: "face.smiling.fill")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(.appTextSecondary)
                            .textCase(.uppercase)
                            .tracking(1)

                        LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 5), spacing: 12) {
                            ForEach(viewModel.emojiOptions, id: \.self) { emoji in
                                Button {
                                    UIImpactFeedbackGenerator(style: .light).impactOccurred()
                                    viewModel.selectedEmoji = emoji
                                } label: {
                                    Text(emoji)
                                        .font(.system(size: 34))
                                        .frame(maxWidth: .infinity)
                                        .aspectRatio(1, contentMode: .fit)
                                        .background(
                                            viewModel.selectedEmoji == emoji
                                            ? Color.appPrimary.opacity(0.25)
                                            : Color.appSurface
                                        )
                                        .cornerRadius(12)
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 12)
                                                .stroke(
                                                    viewModel.selectedEmoji == emoji ? Color.appPrimary : Color.clear,
                                                    lineWidth: 2
                                                )
                                        )
                                }
                                .accessibilityLabel("Avatar \(emoji)")
                            }
                        }
                    }

                    // Timer Selection
                    VStack(alignment: .leading, spacing: 12) {
                        Label("Game Duration", systemImage: "timer")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(.appTextSecondary)
                            .textCase(.uppercase)
                            .tracking(1)

                        LazyVGrid(
                            columns: Array(repeating: GridItem(.flexible()), count: 4),
                            spacing: 10
                        ) {
                            ForEach(viewModel.timerOptions, id: \.self) { mins in
                                Button {
                                    UIImpactFeedbackGenerator(style: .light).impactOccurred()
                                    viewModel.timerMinutes = mins
                                } label: {
                                    Text(viewModel.timerLabel(mins))
                                        .font(.system(size: 13, weight: .bold))
                                        .foregroundColor(viewModel.timerMinutes == mins ? .white : .appTextSecondary)
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 12)
                                        .background(
                                            viewModel.timerMinutes == mins
                                            ? Color.appPrimary
                                            : Color.appSurface
                                        )
                                        .cornerRadius(10)
                                }
                            }
                        }
                    }

                    // Create button
                    Button {
                        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                        Task { await viewModel.createRoom(appState: appState) }
                    } label: {
                        Text("Create Room")
                    }
                    .primaryButtonStyle(isLoading: viewModel.isLoading, isDisabled: !viewModel.canCreate)
                    .disabled(!viewModel.canCreate || viewModel.isLoading)
                }
                .padding(24)
                .padding(.bottom, 40)
            }
        }
        .navigationTitle("Create Room")
        .navigationBarTitleDisplayMode(.inline)
        .errorAlert(error: $viewModel.error)
        .onChange(of: viewModel.createdRoom) { room in
            guard let room else { return }
            path.append(HomeRoute.lobby(roomId: room.roomId))
        }
    }
}

#Preview {
    NavigationStack {
        CreateRoomView(path: .constant(NavigationPath()))
            .environmentObject(AppState())
    }
}
