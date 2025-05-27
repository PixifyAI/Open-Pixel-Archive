"use client"

import { useState, useMemo, useEffect } from "react";
import { FileItem, FileViewMode } from "@/lib/types";
import { Grid2x2, List, MoreHorizontal, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileCard } from "@/components/files/file-card";
import { FileActionMenu } from "@/components/files/file-action-menu";
import { ShareDialog } from "@/components/files/share-dialog";
import { PreviewDialog } from "@/components/files/preview-dialog";

interface FileGridProps {
  files: FileItem[];
  currentFolder: string;
  onViewModeChange: (mode: FileViewMode) => void;
  searchQuery: string;
  onDelete: (file: FileItem) => void;
  onMoveToGallery?: (file: FileItem) => void;
  onFavoriteToggle: (file: FileItem, inGallery: boolean) => void;
  onRename: (file: FileItem, newName: string) => void;
}

export function FileGrid({ files, currentFolder, onViewModeChange, searchQuery, onDelete, onMoveToGallery, onFavoriteToggle, onRename }: FileGridProps) {
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Effect to keep selectedFile in sync with the 'files' prop
  useEffect(() => {
    if (selectedFile) {
      const updatedSelectedFile = files.find(f => f.uniqueName === selectedFile.uniqueName);
      // Always update selectedFile if a matching updated file is found in 'files'
      // This ensures all properties (name, filePath, etc.) are up-to-date
      if (updatedSelectedFile && updatedSelectedFile !== selectedFile) { // Check for object identity change
        setSelectedFile(updatedSelectedFile);
      }
    }
  }, [files, selectedFile]);

  const filteredFiles = useMemo(() => {
    return files.filter(file => {
      const searchMatch = file.name.toLowerCase().includes(searchQuery.toLowerCase());

      if (currentFolder === "root") {
        return searchMatch && file.inGallery !== false; // Show only gallery files for public root
      } else if (currentFolder === "images") {
        return searchMatch && file.type.startsWith("image/");
      } else if (currentFolder === "videos") {
        return searchMatch && file.type.startsWith("video/");
      } else if (currentFolder === "audio") {
        return searchMatch && file.type.startsWith("audio/");
      } else if (currentFolder === "favorites") {
        return searchMatch && file.isFavorite === true;
      } else if (currentFolder === "archive") {
        return searchMatch && file.inGallery === false;
      }
      return false;
    });
  }, [files, currentFolder, searchQuery]);

  const handleShare = (file: FileItem) => {
    setSelectedFile(file);
    setIsShareOpen(true);
  };

  const handlePreview = (file: FileItem) => {
    setSelectedFile(file);
    setIsPreviewOpen(true);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          {currentFolder === "root" ? "All Files" :
           currentFolder.charAt(0).toUpperCase() + currentFolder.slice(1)}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({filteredFiles.length} items)
          </span>
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onViewModeChange("grid")}
            className="bg-accent"
          >
            <Grid2x2 className="h-4 w-4" />
            <span className="sr-only">Grid view</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onViewModeChange("list")}
          >
            <List className="h-4 w-4" />
            <span className="sr-only">List view</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {filteredFiles.map((file) => (
          <FileCard
            key={file.uniqueName} // Use uniqueName as key
            file={file}
            onShare={() => handleShare(file)}
            onPreview={() => handlePreview(file)}
            onDelete={(fileToDelete) => onDelete(fileToDelete)}
            onMoveToGallery={(fileToMove) => onMoveToGallery && onMoveToGallery(fileToMove)}
            onFavoriteToggle={(fileToToggle, inGallery) => onFavoriteToggle(fileToToggle, inGallery)}
            onRename={(fileToRename, newName) => {
              // Call the parent's onRename handler
              onRename(fileToRename, newName);
              // The useEffect hook will handle updating selectedFile if it's the same file
            }}
          />
        ))}
      </div>

      {selectedFile && (
        <>
          <ShareDialog
            file={selectedFile}
            open={isShareOpen}
            onOpenChange={setIsShareOpen}
          />
          <PreviewDialog
            file={selectedFile}
            open={isPreviewOpen}
            onOpenChange={setIsPreviewOpen}
            onShare={() => handleShare(selectedFile!)}
          />
        </>
      )}
    </>
  );
}
