export const IMAGE_MAX_SIZE_BYTES = 50 * 1024 * 1024;     // 50 MB
export const VIDEO_MAX_SIZE_BYTES = 200 * 1024 * 1024;    // 200 MB
export const VIDEO_MAX_DURATION_SECONDS = 120;             // 2 minutes
export const THUMBNAIL_MAX_DIMENSION_PX = 720;

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

export const ALLOWED_VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
];

export const ALLOWED_MIME_TYPES = [
  ...ALLOWED_IMAGE_MIME_TYPES,
  ...ALLOWED_VIDEO_MIME_TYPES,
];

export const GRACE_WINDOW_MS = 30_000; // 30s grace after timer expires
