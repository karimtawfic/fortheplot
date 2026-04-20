import SwiftUI
import PhotosUI
import AVKit

struct ProofUploadView: View {
    let dare: Dare
    let roomId: String
    let playerId: String

    @StateObject private var viewModel = ProofUploadViewModel()
    @Environment(\.dismiss) private var dismiss
    @State private var showPhotoPicker = false
    @State private var photoPickerSelection: PhotosPickerItem?
    @State private var showCameraSheet = false

    var body: some View {
        NavigationStack {
            ZStack {
                Color.appBackground.ignoresSafeArea()
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 24) {
                        dareInfo
                        mediaPreview
                        mediaSourcePicker
                        submitSection
                    }
                    .padding(24)
                    .padding(.bottom, 40)
                }
            }
            .navigationTitle("Prove It")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }.foregroundColor(.appTextSecondary)
                }
            }
        }
        .photosPicker(isPresented: $showPhotoPicker, selection: $photoPickerSelection, matching: .images)
        .onChange(of: photoPickerSelection) { item in
            guard let item else { return }
            viewModel.selectedPhotoItem = item
            Task { await viewModel.processSelectedPhoto() }
        }
        .sheet(isPresented: $showCameraSheet) {
            CameraPickerView { image in
                viewModel.setPhoto(image: image)
                showCameraSheet = false
            }
        }
        .onChange(of: viewModel.uploadState) { state in
            if case .success = state {
                DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) { dismiss() }
            }
        }
    }

    // MARK: - Dare Info

    private var dareInfo: some View {
        VStack(spacing: 12) {
            CategoryChip(category: dare.category)
            Text(dare.text)
                .font(.system(size: 22, weight: .bold, design: .rounded))
                .foregroundColor(.white)
                .multilineTextAlignment(.center)
                .lineSpacing(4)
            PointsBadge(points: dare.points, size: .large)
        }
        .padding(20)
        .frame(maxWidth: .infinity)
        .background(Color.appSurface)
        .cornerRadius(20)
    }

    // MARK: - Media Preview

    @ViewBuilder
    private var mediaPreview: some View {
        if case .success(let pts, let status) = viewModel.uploadState {
            successState(points: pts, status: status)
        } else if let image = viewModel.selectedImage {
            photoPreview(image: image)
        } else if let videoURL = viewModel.selectedVideoURL {
            videoPreview(url: videoURL)
        } else {
            emptyMediaState
        }
    }

    private func photoPreview(image: UIImage) -> some View {
        ZStack(alignment: .topTrailing) {
            Image(uiImage: image).resizable().scaledToFit().cornerRadius(16)
            Button { viewModel.selectedImage = nil } label: {
                Image(systemName: "xmark.circle.fill").font(.system(size: 28)).foregroundColor(.white).shadow(radius: 4)
            }.padding(10)
        }
    }

    private func videoPreview(url: URL) -> some View {
        ZStack(alignment: .topTrailing) {
            if let thumb = viewModel.videoThumbnail {
                Image(uiImage: thumb).resizable().scaledToFit().cornerRadius(16)
                    .overlay(Image(systemName: "play.circle.fill").font(.system(size: 56)).foregroundColor(.white.opacity(0.9)))
            } else {
                RoundedRectangle(cornerRadius: 16).fill(Color.appSurface).aspectRatio(9/16, contentMode: .fit)
                    .overlay(Label("Video selected", systemImage: "video.fill").foregroundColor(.appTextSecondary))
            }
            Button { viewModel.selectedVideoURL = nil } label: {
                Image(systemName: "xmark.circle.fill").font(.system(size: 28)).foregroundColor(.white).shadow(radius: 4)
            }.padding(10)
        }
    }

    private var emptyMediaState: some View {
        RoundedRectangle(cornerRadius: 16).fill(Color.appSurface).aspectRatio(3/4, contentMode: .fit)
            .overlay(VStack(spacing: 12) {
                Image(systemName: "camera.fill").font(.system(size: 44)).foregroundColor(.appTextSecondary)
                Text("Add your proof").font(.system(size: 16, weight: .semibold)).foregroundColor(.appTextSecondary)
                Text("Photo or video required").font(.system(size: 13)).foregroundColor(.appBorder)
            })
    }

    private func successState(points: Int, status: VerificationStatus) -> some View {
        VStack(spacing: 16) {
            switch status {
            case .approved:
                Image(systemName: "checkmark.circle.fill").font(.system(size: 80)).foregroundColor(.appSuccess)
                Text("Dare Complete!").font(.system(size: 28, weight: .black)).foregroundColor(.white)
                Text("+\(points) points").font(.system(size: 22, weight: .bold)).foregroundColor(.appGold)
            case .needsReview:
                Text("🕐").font(.system(size: 72))
                Text("Submitted!").font(.system(size: 28, weight: .black)).foregroundColor(.white)
                Text("Awaiting host approval").font(.system(size: 16)).foregroundColor(.appTextSecondary)
            case .pending:
                Text("⏳").font(.system(size: 72))
                Text("Submitted!").font(.system(size: 28, weight: .black)).foregroundColor(.white)
                Text("Verifying…").font(.system(size: 16)).foregroundColor(.appTextSecondary)
            default:
                Image(systemName: "checkmark.circle.fill").font(.system(size: 80)).foregroundColor(.appSuccess)
                Text("Submitted!").font(.system(size: 28, weight: .black)).foregroundColor(.white)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(40)
        .background(Color.appSurface)
        .cornerRadius(20)
    }

    // MARK: - Media Source

    private var mediaSourcePicker: some View {
        VStack(spacing: 10) {
            if viewModel.isProcessing {
                uploadProgressView
            } else {
                HStack(spacing: 12) {
                    Button {
                        viewModel.mediaType = .image
                        showPhotoPicker = true
                    } label: {
                        Label("Photo", systemImage: "photo.fill").frame(maxWidth: .infinity)
                    }.secondaryButtonStyle()

                    Button { showCameraSheet = true } label: {
                        Label("Camera", systemImage: "camera.fill").frame(maxWidth: .infinity)
                    }.secondaryButtonStyle()
                }

                PhotosPicker(
                    selection: Binding(get: { nil }, set: { item in
                        if let item { Task { await viewModel.processSelectedVideo(item: item) } }
                    }),
                    matching: .videos
                ) {
                    Label("Pick Video", systemImage: "video.fill").frame(maxWidth: .infinity)
                }.secondaryButtonStyle()
            }
        }
    }

    private var uploadProgressView: some View {
        VStack(spacing: 10) {
            HStack {
                Text(uploadStateText).font(.system(size: 14, weight: .medium)).foregroundColor(.appTextSecondary)
                Spacer()
                Text("\(Int(viewModel.uploadProgress * 100))%").font(.system(size: 14, weight: .bold)).foregroundColor(.appPrimary)
            }
            ProgressView(value: viewModel.uploadProgress).tint(.appPrimary).background(Color.appBorder).cornerRadius(4)
        }
        .padding(16).background(Color.appSurface).cornerRadius(12)
    }

    private var uploadStateText: String {
        switch viewModel.uploadState {
        case .compressing: return "Compressing media…"
        case .uploading: return "Uploading…"
        case .submitting: return "Submitting…"
        default: return ""
        }
    }

    // MARK: - Submit

    private var submitSection: some View {
        Group {
            if case .success = viewModel.uploadState {
                EmptyView()
            } else if case .failure(let msg) = viewModel.uploadState {
                VStack(spacing: 12) {
                    Text(msg).font(.system(size: 14)).foregroundColor(.red).multilineTextAlignment(.center)
                    Button("Try Again") { viewModel.uploadState = .idle }.secondaryButtonStyle()
                }
            } else {
                Button {
                    UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
                    Task { await viewModel.submit(dare: dare, roomId: roomId, playerId: playerId) }
                } label: {
                    Label("Submit Proof", systemImage: "checkmark")
                }
                .primaryButtonStyle(isLoading: viewModel.isProcessing, isDisabled: !viewModel.hasMedia)
                .disabled(!viewModel.hasMedia || viewModel.isProcessing)
            }
        }
    }
}

// MARK: - Camera Picker

struct CameraPickerView: UIViewControllerRepresentable {
    var onCapture: (UIImage) -> Void

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = .camera
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}
    func makeCoordinator() -> Coordinator { Coordinator(onCapture: onCapture) }

    final class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        var onCapture: (UIImage) -> Void
        init(onCapture: @escaping (UIImage) -> Void) { self.onCapture = onCapture }

        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
            if let image = info[.editedImage] as? UIImage ?? info[.originalImage] as? UIImage { onCapture(image) }
            picker.dismiss(animated: true)
        }

        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) { picker.dismiss(animated: true) }
    }
}

#Preview {
    ProofUploadView(dare: .preview, roomId: "room-123", playerId: "player-1")
}
