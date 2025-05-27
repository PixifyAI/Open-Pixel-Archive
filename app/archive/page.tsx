"use client"

import { useState, useEffect, useCallback } from "react"; // Import useState, useEffect, useCallback
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { FileGrid } from "@/components/files/file-grid";
import { FileItem } from "@/lib/types";
import { toast } from "@/hooks/use-toast"; // Import toast

export default function ArchivePage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [uploaderId, setUploaderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const storedUploaderId = sessionStorage.getItem('userId');
    setUploaderId(storedUploaderId);
  }, []);

  const fetchArchiveFiles = useCallback(async (userId: string | null, query: string) => {
    if (!userId) {
      setFiles([]);
      return;
    }
    try {
      const url = new URL('/api/files', window.location.origin);
      url.searchParams.append('uploaderId', userId);
      url.searchParams.append('currentFolder', 'archive'); // Request archive files
      if (query) {
        url.searchParams.append('search', query);
      }

      const res = await fetch(url.toString(), {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch archive data");
      }
      const data: FileItem[] = await res.json();
      setFiles(data);
    } catch (error: any) {
      console.error('Error fetching archive data:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch archive data.",
        variant: "destructive",
      });
      setFiles([]);
    }
  }, []);

  useEffect(() => {
    fetchArchiveFiles(uploaderId, searchQuery);
  }, [uploaderId, searchQuery, fetchArchiveFiles]);

  const handleMoveToGallery = async (fileToMove: FileItem) => {
    if (!uploaderId) {
      toast({
        title: "Authentication Required",
        description: "Please log in to move files.",
        variant: "destructive",
      });
      return;
    }
    try {
      const res = await fetch('/api/files', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uniqueName: fileToMove.uniqueName, inGallery: true, uploaderId: uploaderId }),
      });

      if (res.ok) {
        toast({
          title: "File moved",
          description: "File successfully moved to the gallery.",
        });
        fetchArchiveFiles(uploaderId, searchQuery); // Re-fetch to update the list
      } else {
        const errorData = await res.json();
        toast({
          title: "Failed to move file",
          description: errorData.message || "An error occurred.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error moving file to gallery:', error);
      toast({
        title: "Failed to move file",
        description: "An error occurred while moving the file.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFile = async (fileToDelete: FileItem) => {
    if (!uploaderId) {
      toast({
        title: "Authentication Required",
        description: "Please log in to delete your files.",
        variant: "destructive",
      });
      return;
    }
    try {
      const response = await fetch('/api/files', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uniqueName: fileToDelete.uniqueName, uploaderId: uploaderId }),
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
        fetchArchiveFiles(uploaderId, searchQuery); // Re-fetch to update the list
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

  const handleRenameFile = async (fileToRename: FileItem, newName: string) => {
    if (!uploaderId) {
      toast({
        title: "Authentication Required",
        description: "Please log in to rename your files.",
        variant: "destructive",
      });
      return;
    }
    try {
      const response = await fetch('/api/files', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uniqueName: fileToRename.uniqueName, newName, uploaderId: uploaderId }),
      });

      if (response.ok) {
        toast({
          title: "File renamed",
          description: `${fileToRename.name} renamed to ${newName}.`,
        });
        fetchArchiveFiles(uploaderId, searchQuery); // Re-fetch to update the list
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

  // For archive page, onFavoriteToggle should behave as "move to gallery"
  const handleFavoriteToggle = async (fileToToggle: FileItem, inGallery: boolean) => {
    // This function is called from FileCard/FileActionMenu.
    // For archive files, the "favorite" button actually means "move to gallery".
    // So, we call handleMoveToGallery with the file.
    // The `inGallery` parameter from FileActionMenu will be `true` if it's currently in archive (meaning it wants to move to gallery)
    // and `false` if it's currently in gallery (meaning it wants to move to archive).
    // Since we are on the archive page, `fileToToggle.inGallery` should be `false`.
    // The action is to move it to gallery, so we call handleMoveToGallery.
    if (!fileToToggle.inGallery) { // If it's currently in archive
      handleMoveToGallery(fileToToggle);
    } else {
      // This case should ideally not happen on the archive page, as files here should have inGallery: false
      toast({
        title: "Invalid Action",
        description: "File is already in gallery.",
        variant: "default", // Changed from "info" to "default"
      });
    }
  };

  const totalStorageUsed = files.reduce((sum, file) => sum + file.size, 0);

  return (
    <div className="flex h-screen flex-col">
      <Header onSearch={setSearchQuery} onOpenUpload={() => {}} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentFolder="archive"
          onFolderChange={() => {}}
          onOpenUpload={() => {}}
          totalStorageUsed={totalStorageUsed}
        />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="space-y-6">
            <h1 className="text-2xl font-semibold mb-4">My Archive</h1>
            <FileGrid
              files={files}
              currentFolder="archive" // Ensure FileGrid filters for archive
              onViewModeChange={() => {}}
              searchQuery={searchQuery}
              onDelete={handleDeleteFile}
              onRename={handleRenameFile}
              onFavoriteToggle={handleFavoriteToggle} // Pass the correct handler
              onMoveToGallery={handleMoveToGallery} // Pass handleMoveToGallery
            />
          </div>
        </main>
      </div>
    </div>
  );
}
