import SwiftUI
import Firebase

@main
struct OutAndAboutApp: App {
    @StateObject private var appState = AppState()

    init() {
        FirebaseApp.configure()
        configureAppearance()
    }

    var body: some Scene {
        WindowGroup {
            SplashView()
                .environmentObject(appState)
                .preferredColorScheme(.dark)
        }
    }

    private func configureAppearance() {
        let navBarAppearance = UINavigationBarAppearance()
        navBarAppearance.configureWithOpaqueBackground()
        navBarAppearance.backgroundColor = UIColor(Color.appBackground)
        navBarAppearance.titleTextAttributes = [.foregroundColor: UIColor.white]
        navBarAppearance.largeTitleTextAttributes = [.foregroundColor: UIColor.white]
        UINavigationBar.appearance().standardAppearance = navBarAppearance
        UINavigationBar.appearance().scrollEdgeAppearance = navBarAppearance

        UITableView.appearance().backgroundColor = .clear
        UICollectionView.appearance().backgroundColor = .clear
    }
}
