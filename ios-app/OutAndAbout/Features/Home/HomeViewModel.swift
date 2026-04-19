import SwiftUI

@MainActor
final class HomeViewModel: ObservableObject {
    @Published var error: String?

    private let roomRepo = RoomRepository()

    func checkForActiveRoom(appState: AppState, path: Binding<NavigationPath>) {
        guard let room = appState.currentRoom else { return }
        guard room.status == .live || room.status == .lobby else {
            appState.clearSession()
            return
        }
        if room.status == .live {
            path.wrappedValue.append(HomeRoute.gameplay(roomId: room.roomId))
        } else {
            path.wrappedValue.append(HomeRoute.lobby(roomId: room.roomId))
        }
    }
}
