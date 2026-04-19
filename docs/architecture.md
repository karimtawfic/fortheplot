# Out & About — Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    iOS App (SwiftUI)                     │
│  MVVM + Repository Pattern                               │
│  AsyncStream Firestore listeners                         │
└─────────────┬───────────────────────────────────────────┘
              │ Firebase iOS SDK
              ▼
┌─────────────────────────────────────────────────────────┐
│               Firebase Platform (GCP)                    │
│                                                         │
│  ┌────────────────┐  ┌────────────────┐                │
│  │   Firestore    │  │  Firebase Auth │                │
│  │  (NoSQL DB)    │  │  (Anonymous)   │                │
│  └───────┬────────┘  └────────────────┘                │
│          │ triggers                                      │
│  ┌───────▼─────────────────────────────────────────┐   │
│  │         Cloud Functions (TypeScript)             │   │
│  │  createRoom / joinRoom / startGame               │   │
│  │  submitDare / endGame / scheduledGameEnd         │   │
│  │  createReelJobs / triggerRenderWorker            │   │
│  └─────────────────┬───────────────────────────────┘   │
│                    │ HTTP POST                           │
│  ┌─────────────────▼───────────────────────────────┐   │
│  │         Cloud Run (render-worker)                │   │
│  │  Node.js + ffmpeg                                │   │
│  │  Downloads assets → renders mp4 → uploads        │   │
│  └─────────────────┬───────────────────────────────┘   │
│                    │                                     │
│  ┌─────────────────▼───────────────────────────────┐   │
│  │            Firebase Storage                      │   │
│  │  submissions/ thumbnails/ reels/                │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## Room Lifecycle

```
lobby → live → ended → rendering → (complete, tracked per job)
```

1. **lobby**: Host creates room, players join via invite code
2. **live**: Game timer is running, dare submissions accepted
3. **ended**: Timer expired, no more submissions (set by scheduledGameEnd function)
4. **rendering**: Reel jobs created and dispatched to Cloud Run worker

Status transitions are gated through Cloud Functions. Clients cannot change room `status` directly (Firestore rules block it).

---

## Data Model

### Collection Hierarchy

```
rooms/{roomId}
  - roomId, hostPlayerId, status, timerMinutes
  - startedAt, endsAt, inviteCode, currentPlayerCount
  - personalReelsReadyCount, groupReelReady

rooms/{roomId}/players/{playerId}
  - playerId, displayName, avatarEmoji, totalPoints
  - isHost, joinedAt, lastSeenAt

rooms/{roomId}/submissions/{submissionId}
  - submissionId, playerId, dareId, dareTextSnapshot
  - pointsAwarded, mediaType, mediaUrl, thumbnailUrl
  - createdAt, renderEligible

dares/{dareId}
  - dareId, text, points, category, active

reelJobs/{jobId}
  - jobId, roomId, playerId (null for group)
  - type (personal|group), status (queued|processing|complete|failed)
  - outputUrl, createdAt, updatedAt, errorMessage
```

---

## Authentication

Anonymous Firebase Auth is used. Players authenticate on app launch before any game interaction. Their `uid` becomes their `playerId`. This provides:
- Zero-friction join flow
- Persistent identity within a session
- Firestore security rules can scope reads/writes to authenticated users

No PII is collected. Display names and emoji avatars are ephemeral per session.

---

## Realtime Data Strategy

Firestore snapshot listeners are wrapped in `AsyncStream` for Swift structured concurrency:

```swift
func listenToRoom(roomId: String) -> AsyncStream<Room?> {
    AsyncStream { continuation in
        let listener = db.collection("rooms").document(roomId)
            .addSnapshotListener { snap, _ in
                continuation.yield(try? snap?.data(as: Room.self))
            }
        continuation.onTermination = { _ in listener.remove() }
    }
}

// In ViewModel:
Task {
    for await room in roomRepo.listenToRoom(roomId: id) {
        self.room = room
        if room?.status == .live { navigateToGame = true }
    }
}
```

Each ViewModel holds an array of `Task` handles. `stopListening()` cancels them all, which triggers `onTermination` on the AsyncStream, removing the Firestore listener. This prevents listener leaks.

---

## Score Integrity

Points are **server-authoritative**:

1. Client uploads media to Storage
2. Client calls `submitDare` Cloud Function with mediaUrl
3. Function runs a Firestore **transaction**:
   - Reads room (verify status == live, endsAt not passed)
   - Reads player (verify membership)
   - Reads dare (get points value)
   - Queries submissions for duplicate (same playerId + dareId)
   - Writes submission + increments player.totalPoints atomically
4. Function returns `{ submissionId, pointsAwarded, newTotal }`

Clients cannot write `totalPoints` directly — Firestore rules block it.

---

## Timer Architecture

- Server writes `endsAt` timestamp when game starts
- iOS clients compute countdown: `max(0, endsAt - Date.now())`
- A `Timer.publish(every: 1)` triggers UI re-renders
- `scheduledGameEnd` Cloud Function (runs every minute) catches any rooms where `endsAt < now AND status == 'live'`
- This ensures game end even if no client triggers it

---

## Media Upload Pipeline

```
1. User captures photo/video
2. Photo: JPEG compress at 80% quality
   Video: AVAssetExportSession at MediumQuality preset
3. Generate thumbnail for video (AVAssetImageGenerator at 0.5s)
4. Upload to Storage: submissions/{roomId}/{playerId}/{uuid}.{ext}
5. Upload thumbnail to: thumbnails/{roomId}/{playerId}/{uuid}_thumb.jpg
6. Call submitDare Cloud Function with both URLs
```

---

## Reel Generation Pipeline

```
Game ends
    ↓
endGame() [Cloud Function]
    Sets room.status = 'rendering'
    ↓
createReelJobsInternal() [internal]
    Creates ReelJob docs (one per player + one group)
    Status: queued
    ↓
triggerRenderWorker [Firestore onCreate trigger]
    For each new ReelJob doc:
    → Sets status = 'processing'
    → POSTs {jobId} to Cloud Run render-worker HTTP endpoint
    ↓
render-worker [Cloud Run]
    Reads job from Firestore
    Downloads submission assets from Storage to /tmp/{jobId}/
    Runs ffmpeg pipeline:
        - Title card (lavfi color + drawtext)
        - Per submission: photo→clip or video+overlay
        - Concatenate with concat demuxer
        - libx264, preset fast, movflags +faststart
    Uploads output.mp4 to reels/{roomId}/{playerId}_personal.mp4
    Updates ReelJob: status=complete, outputUrl=signedUrl
    ↓
iOS app [Firestore listener]
    Observes ReelJob.status change to 'complete'
    Enables "Watch Reel" button
    → ReelPreviewView streams video from outputUrl
```

---

## Security Model

### Layers of Defense

1. **Firebase Auth** — all operations require authentication
2. **Firestore Rules** — scoped read/write per collection
3. **Storage Rules** — players can only write to their own paths
4. **Cloud Functions** — server-side validation for all state transitions
5. **Transactions** — atomic score updates prevent race conditions

### Key Rules Decisions

- `rooms/{roomId}`: clients can read, host can update timer/start. Status transitions only via Cloud Functions (admin SDK bypasses rules).
- `submissions/{submissionId}`: **all client writes blocked**. Only via `submitDare` Cloud Function.
- `reelJobs/{jobId}`: **all client writes blocked**. Only via Functions/render-worker.
- `players/{playerId}`: players can update their own doc but **not** `totalPoints`, `isHost`, or `roomId`.

---

## iOS App Architecture

```
Features/
  Each feature = View + ViewModel (where needed)
  ViewModels are @MainActor final classes with @Published properties
  Views observe ViewModels via @StateObject / @ObservedObject

Core/
  Firebase/   — AuthService, FirestoreService, StorageService
  Models/     — Codable value types (structs) matching Firestore schema
  Repositories/ — Protocol + concrete impl for each Firestore collection
  Extensions/ — View modifiers, Color theme

App/
  OutAndAboutApp.swift — @main, FirebaseApp.configure()
  AppState.swift — global observable state (currentUser, currentRoom, currentPlayer)
```

### Navigation

Uses SwiftUI `NavigationStack` with `NavigationPath` for type-safe navigation. Routes are defined as `enum HomeRoute: Hashable`.

### Dependency Injection

ViewModels create concrete repository instances directly (simple, works for MVP). For testing, repositories conform to protocols — `MockRoomRepository` can be injected in tests.

---

## Scalability Considerations

- **20 player max** per room is enforced in `joinRoom` transaction
- **Concurrent rooms**: unlimited — each room is an isolated Firestore sub-tree
- **Firestore read scale**: 1 snapshot listener per player per screen is fine for 20 players
- **Storage**: Firebase Storage auto-scales; no configuration needed
- **Cloud Run render-worker**: `--concurrency 1` means one render job per instance; Cloud Run auto-scales instances for parallel jobs across rooms
- **Cloud Functions**: Stateless, auto-scale. The `submitDare` transaction protects against concurrent submission races.
