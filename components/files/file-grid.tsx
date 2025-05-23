"use client"

import { useState, useMemo } from "react"; // Import useMemo
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
  searchQuery: string; // Add searchQuery prop
  onDelete: (filePath: string) => void; // Add onDelete prop
}

export function FileGrid({ files, currentFolder, onViewModeChange, searchQuery, onDelete }: FileGridProps) {
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Filter files based on currentFolder and searchQuery using useMemo for performance
  const filteredFiles = useMemo(() => {
    return files.filter(file => {
      const searchMatch = file.name.toLowerCase().includes(searchQuery.toLowerCase());

      if (currentFolder === "root") {
        return searchMatch;
      } else if (currentFolder === "images") {
        return searchMatch && file.type.startsWith("image/");
      } else if (currentFolder === "videos") {
        return searchMatch && file.type.startsWith("video/");
      } else if (currentFolder === "audio") {
        return searchMatch && file.type.startsWith("audio/");
      }
      // Add filtering logic for 'recent', 'favorites', and 'trash' here
      // For now, other folders will show no files
      return false;
    });
  }, [files, currentFolder, searchQuery]); // Re-run memoization when files, currentFolder, or searchQuery change
  
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
            key={file.id} 
            file={file} 
            onShare={() => handleShare(file)}
            onPreview={() => handlePreview(file)}
            onDelete={onDelete} // Pass the onDelete prop received from parent
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
            onShare={() => handleShare(selectedFile!)} // Pass the onShare prop
          />
        </>
      )}
    </>
  );
}
