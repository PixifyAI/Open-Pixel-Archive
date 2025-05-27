"use client"

"use client"

import { useState, useEffect } from "react";
import path from "path"; // Import path
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { FileGrid } from "@/components/files/file-grid";
import { FileList } from "@/components/files/file-list";
import { UploadDropzone } from "@/components/upload/upload-dropzone";
import { FileViewMode, FileItem } from "@/lib/types";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { UploadModal } from "@/components/upload/upload-modal";
import { toast } from "@/hooks/use-toast";

export function MainDashboard() {
  const [viewMode, setViewMode] = useState<FileViewMode>("grid");
  const [currentFolder, setCurrentFolder] = useState("root");
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploaderId, setUploaderId] = useState<string | null>(null);

  useEffect(() => {
    const storedUploaderId = sessionStorage.getItem('userId');
    setUploaderId(storedUploaderId);
    fetchFiles(searchQuery, storedUploaderId, currentFolder);
  }, [searchQuery, currentFolder]);

  const fetchFiles = async (query = "", userId: string | null, folder: string) => {
    console.log("Fetching files with query:", query, "for user:", userId, "in folder:", folder);
    try {
      const url = new URL('/api/files', window.location.origin);
      if (userId) {
        url.searchParams.append('uploaderId', userId);
      }
      url.searchParams.append('currentFolder', folder);
      if (query) {
        url.searchParams.append('search', query);
      }

      const response = await fetch(url.toString(), {
        cache: "no-store",
      });
      if (response.ok) {
        const data: FileItem[] = await response.json();
        console.log("Fetched files data:", data);
        setFiles(data);
      } else {
        console.error('Error fetching files:', response.statusText);
        setFiles([]);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      setFiles([]);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleViewModeChange = (mode: FileViewMode) => {
    setViewMode(mode);
  };

  const handleFolderChange = (folderId: string) => {
    setCurrentFolder(folderId);
  };

  const handleUploadStart = () => {
    setIsUploading(true);
  };

  const handleUploadComplete = () => {
    setIsUploading(false);
    fetchFiles(searchQuery, uploaderId, currentFolder);
  };

  const handleDeleteFile = async (fileToDelete: FileItem) => {
    const isAnonymousFile = fileToDelete.uploaderId === 'anonymous';
    const isOwnedByCurrentUser = uploaderId && uploaderId !== 'anonymous' && fileToDelete.uploaderId === uploaderId;

    // If it's not an anonymous file AND it's not owned by the current user, prevent deletion
    if (!isAnonymousFile && !isOwnedByCurrentUser) {
      toast({
        title: "Permission Denied",
        description: "You can only delete your own files or anonymous public files.",
        variant: "destructive",
      });
      return;
    }

    const targetUploaderId = fileToDelete.uploaderId; // Use the uploaderId from the file itself

    try {
      const response = await fetch('/api/files', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uniqueName: fileToDelete.uniqueName, uploaderId: targetUploaderId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Error deleting file ${fileToDelete.name}:`, errorData.message);
        toast({
          title: "Failed to delete file",
          description: errorData.message || "An error occurred.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "File deleted",
          description: "File successfully deleted.",
        });
        setFiles(prevFiles => prevFiles.filter(file => file.uniqueName !== fileToDelete.uniqueName));
      }
    } catch (error) {
      console.error(`Error deleting file ${fileToDelete.name}:`, error);
      toast({
        title: "Failed to delete file",
        description: "An error occurred while deleting the file.",
        variant: "destructive",
      });
    }
  };

  const handleFavoriteToggle = async (fileToToggle: FileItem, newInGalleryStatus: boolean) => {
    // Determine if the file is owned by the current user or is a public gallery file.
    const isOwnedByUser = fileToToggle.uploaderId === uploaderId && uploaderId !== 'anonymous';

    if (isOwnedByUser) {
      // User is moving their own file between gallery and archive
      try {
        const response = await fetch('/api/files', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ uniqueName: fileToToggle.uniqueName, inGallery: newInGalleryStatus, uploaderId: uploaderId }),
        });

        if (response.ok) {
          toast({
            title: "File status updated",
            description: `File moved to ${newInGalleryStatus ? 'gallery' : 'archive'}.`,
          });
          fetchFiles(searchQuery, uploaderId, currentFolder);
        } else {
          const errorData = await response.json();
          toast({
            title: "Failed to update file status",
            description: errorData.message || "An error occurred.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error moving file:", error);
        toast({
          title: "Failed to update file status",
          description: "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    } else {
      // User is favoriting/unfavoriting a public gallery file
      if (!uploaderId || uploaderId === 'anonymous') {
        toast({
          title: "Authentication Required",
          description: "Please log in to favorite public files.",
          variant: "destructive",
        });
        return;
      }
      try {
        const response = await fetch('/api/files', { // Use /api/files for favorite toggle
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ uniqueName: fileToToggle.uniqueName, isFavorite: !fileToToggle.isFavorite, uploaderId: uploaderId }),
        });

        if (response.ok) {
          toast({
            title: "Favorite status updated",
            description: `File ${fileToToggle.isFavorite ? 'removed from' : 'added to'} favorites.`,
          });
          fetchFiles(searchQuery, uploaderId, currentFolder); // Re-fetch to update favorite status
        } else {
          const errorData = await response.json();
          toast({
            title: "Failed to update favorite status",
            description: errorData.message || "An error occurred.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error toggling favorite:", error);
        toast({
          title: "Failed to update favorite status",
          description: "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    }
  };

  const handleRenameFile = async (fileToRename: FileItem, newName: string) => {
    const isOwnedByUser = fileToRename.uploaderId === uploaderId && uploaderId !== 'anonymous';
    const targetUploaderId = isOwnedByUser ? uploaderId : undefined; // Send uploaderId only if owned by user

    if (!isOwnedByUser && fileToRename.uploaderId !== 'anonymous') { // If it's a public file not uploaded anonymously
      toast({
        title: "Permission Denied",
        description: "You can only rename your own files or anonymous public files.",
        variant: "destructive",
      });
      return;
    }

    // If it's an anonymous public file, allow renaming without specific uploaderId
    if (fileToRename.uploaderId === 'anonymous' && !uploaderId) {
      // Allow anonymous renaming of anonymous files
    } else if (!uploaderId) {
      toast({
        title: "Authentication Required",
        description: "Please log in to rename files.",
        variant: "destructive",
      });
      return;
    }

    console.log("DEBUG: Renaming payload:", { uniqueName: fileToRename.uniqueName, newName, uploaderId: targetUploaderId });
    try {
      const response = await fetch('/api/files', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uniqueName: fileToRename.uniqueName, newName, uploaderId: targetUploaderId }),
      });

      if (response.ok) {
        const responseData = await response.json();
        const updatedFileItem = responseData.file; // Get the full updated FileItem
        toast({
          title: "File renamed",
          description: `${fileToRename.name} renamed to ${updatedFileItem.name}.`,
        });
        setFiles(prevFiles =>
          prevFiles.map(file =>
            file.uniqueName === updatedFileItem.uniqueName
              ? updatedFileItem // Replace with the fully updated FileItem
              : file
          )
        );
      } else {
        const errorData = await response.json();
        toast({
          title: "Rename failed",
          description: errorData.message || "An error occurred.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error renaming file:", error);
      toast({
        title: "Rename failed",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const totalStorageUsed = files.reduce((sum, file) => sum + file.size, 0);

  return (
    <div className="flex h-screen flex-col">
      <Header onSearch={handleSearch} onOpenUpload={() => setIsUploadOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentFolder={currentFolder}
          onFolderChange={handleFolderChange}
          onOpenUpload={() => setIsUploadOpen(true)}
          totalStorageUsed={totalStorageUsed}
        />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <UploadDropzone
            onUploadStart={handleUploadStart}
            onUploadComplete={handleUploadComplete}
          >
            <div className="space-y-6">
              {viewMode === "grid" ? (
                <FileGrid
                  files={files}
                  currentFolder={currentFolder}
                  onViewModeChange={handleViewModeChange}
                  searchQuery={searchQuery}
                  onDelete={handleDeleteFile}
                  onFavoriteToggle={handleFavoriteToggle} // Pass handleFavoriteToggle
                  onRename={handleRenameFile} // Pass handleRenameFile
                />
              ) : (
                <FileList
                  files={files}
                  currentFolder={currentFolder}
                  onViewModeChange={handleViewModeChange}
                  searchQuery={searchQuery}
                  onDelete={handleDeleteFile}
                  onRename={handleRenameFile} // Pass onRename
                  onFavoriteToggle={handleFavoriteToggle} // Pass onFavoriteToggle
                />
              )}
            </div>
          </UploadDropzone>
        </main>
      </div>
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <UploadModal
            onClose={() => setIsUploadOpen(false)}
            onUploadComplete={handleUploadComplete}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
