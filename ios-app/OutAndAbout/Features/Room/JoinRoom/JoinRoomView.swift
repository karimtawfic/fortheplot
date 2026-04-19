import SwiftUI

struct JoinRoomView: View {
    @EnvironmentObject var appState: AppState
    @StateObject private var viewModel = JoinRoomViewModel()
    @Binding var path: NavigationPath
    @FocusState private var codeFocused: Bool
    @FocusState private var nameFocused: Bool

    var body: some View {
        ZStack {
            Color.appBackground.ignoresSafeArea()

            ScrollView(showsIndicators: false) {
                VStack(spacing: 28) {
                    // Invite Code
                    VStack(alignment: .leading, spacing: 8) {
                        Label("Room Code", systemImage: "key.fill")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(.appTextSecondary)
                            .textCase(.uppercase)
                            .tracking(1)

                        TextField("XXXXXX", text: $viewModel.inviteCode)
                            .font(.system(size: 32, weight: .black, design: .monospaced))
                            .foregroundColor(.appPrimary)
                            .multilineTextAlignment(.center)
                            .textInputAutocapitalization(.characters)
                            .autocorrectionDisabled()
                            .padding(20)
                            .background(Color.appSurface)
                            .cornerRadius(14)
                            .overlay(
                                RoundedRectangle(cornerRadius: 14)
                                    .stroke(
                                        viewModel.inviteCode.count == 6 ? Color.appPrimary : Color.appBorder,
                                        lineWidth: 1.5
                                    )
                            )
                            .focused($codeFocused)
                            .onChange(of: viewModel.inviteCode) { val in
                                viewModel.inviteCode = String(val.uppercased().prefix(6))
                            }
                            .onSubmit { codeFocused = false; nameFocused = true }
                            .accessibilityLabel("6-letter room code")
                    }

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
                            }
                        }
                    }

                    Button {
                        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                        nameFocused = false
                        codeFocused = false
                        Task { await viewModel.joinRoom(appState: appState) }
                    } label: {
                        Text("Join Room")
                    }
                    .primaryButtonStyle(isLoading: viewModel.isLoading, isDisabled: !viewModel.canJoin)
                    .disabled(!viewModel.canJoin || viewModel.isLoading)
                }
                .padding(24)
                .padding(.bottom, 40)
            }
        }
        .navigationTitle("Join Room")
        .navigationBarTitleDisplayMode(.inline)
        .errorAlert(error: $viewModel.error)
        .onChange(of: viewModel.joinedRoom) { room in
            guard let room else { return }
            path.append(HomeRoute.lobby(roomId: room.roomId))
        }
        .onAppear { codeFocused = true }
    }
}

#Preview {
    NavigationStack {
        JoinRoomView(path: .constant(NavigationPath()))
            .environmentObject(AppState())
    }
}
