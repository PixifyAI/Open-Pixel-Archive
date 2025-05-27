"use client"

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { FileGrid } from "@/components/files/file-grid";
import { FileItem } from "@/lib/types";
import { toast } from "@/hooks/use-toast";

async function getFavoriteFiles(): Promise<FileItem[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/files?isFavorite=true`, {
    cache: "no-store",
  });
  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error("Failed to fetch favorite data");
  }
  return res.json();
}

export default function FavoritesPage() {
  const [files, setFiles] = useState<FileItem[]>([]);

  // Function to fetch favorite files
  const fetchFilesData = async () => {
    const filesData = await getFavoriteFiles(); // Fetch from a new favorites endpoint
    setFiles(filesData);
  };

  // Fetch files on component mount
  useEffect(() => {
    fetchFilesData();
  }, []);

  const handleFavoriteToggle = async (file: FileItem, newFavoriteStatus: boolean) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/files`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uniqueName: file.uniqueName,
          isFavorite: newFavoriteStatus,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update favorite status");
      }

      toast({
        title: "Favorite status updated",
        description: `${file.name} has been ${newFavoriteStatus ? "added to" : "removed from"} favorites.`,
      });

      // After successful update, re-fetch files to update the UI
      fetchFilesData();
    } catch (error: any) {
      console.error("Error toggling favorite status:", error);
      toast({
        title: "Failed to update favorite status",
        description: "An error occurred while updating favorite status.",
        variant: "destructive",
      });
    }
  };

  const handleRenameFile = (file: FileItem, newName: string) => {
    // Refetch files after rename to update the list
    // The actual rename API call is handled by the component that triggers this (e.g., FileActionMenu)
    fetchFilesData();
  };

  // Calculate total storage used (optional for favorites page, but keeping for now)
  const totalStorageUsed = files.reduce((sum, file) => sum + file.size, 0);

  return (
    <div className="flex h-screen flex-col">
      <Header onSearch={() => {}} onOpenUpload={() => {}} /> {/* Dummy functions for Header props */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentFolder="favorites" // Indicate the current folder is favorites
          onFolderChange={() => {}} // Dummy function
          onOpenUpload={() => {}} // Dummy function
          totalStorageUsed={totalStorageUsed} // Pass the calculated total storage used
        />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="space-y-6">
            <h1 className="text-2xl font-semibold mb-4">My Favorites</h1>
            <FileGrid
              files={files}
              currentFolder="favorites" // Indicate the current folder is favorites for FileGrid filtering
              onViewModeChange={() => {}} // Dummy function
              searchQuery="" // Empty search query
              onDelete={() => {}} // Dummy function
              onMoveToGallery={() => {}} // Dummy function as moving from favorites might not be needed
              onFavoriteToggle={handleFavoriteToggle} // Pass the new handleFavoriteToggle function
              onRename={handleRenameFile} // Pass handleRenameFile
            />
          </div>
        </main>
      </div>
    </div>
  );
}
