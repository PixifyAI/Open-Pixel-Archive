export type FileViewMode = "grid" | "list";

export interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  filePath: string; // Add filePath property
  modifiedAt: string;
  folder: string;
  previewImageUrl?: string; // Optional field for preview image URL
}

export interface Folder {
  id: string;
  name: string;
  files: FileItem[];
  createdAt: string;
  parent?: string;
}

export interface ShareSettings {
  password?: string;
  expiresAt?: string;
  allowDownload: boolean;
}
