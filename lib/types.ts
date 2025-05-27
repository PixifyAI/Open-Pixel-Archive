export type FileViewMode = "grid" | "list";

export interface FileItem {
  id: string; // Unique ID for the file
  name: string; // Original file name (e.g., "my-photo.jpg")
  uniqueName: string; // Unique ID for the file (UUID, e.g., "fadc1953-8baa-4b31-a6a6-b6b80845ee60")
  type: string;
  size: number;
  url: string; // Public URL path (e.g., "/uploads/fadc1953-8baa-4b31-a6a6-b6b80845ee60-my-photo.jpg")
  filePath: string; // Full path on the server (e.g., "/uploads/fadc1953-8baa-4b31-a6a6-b6b80845ee60-my-photo.jpg")
  modifiedAt: string; // Date of last modification/upload
  folder: string; // e.g., "root", "images", "videos", "audio"
  previewImageUrl?: string;
  inGallery?: boolean; // True if in public gallery, false if in private archive
  isFavorite?: boolean; // True if favorited by a user (for public files)
  uploaderId?: string; // ID of the user who uploaded the file (can be anonymous)
  deletionDate?: string; // Date after which anonymous files should be deleted
  shareLink?: string; // The generated shareable URL
  shareToken?: string; // Unique token for the share link
  shareExpiryDate?: string; // Expiry date for the share link (ISO string)
  sharePassword?: string; // Password for the share link (hashed)
}

export interface Comment {
  commentId: string;
  fileUniqueName: string;
  userId: string; // Link to user
  content: string;
  date: string;
}

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  sessionId?: string;
  comments: Comment[]; // User's comments
  favoriteFileUniqueNames: string[]; // Unique names of public files favorited by this user
}
