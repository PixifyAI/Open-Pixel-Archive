"use client"

import { useState, useEffect } from "react";
import Image from "next/image";
import { FileItem } from "@/lib/types";
import { formatBytes, formatDate } from "@/lib/utils";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { FileActionMenu } from "@/components/files/file-action-menu";
import { FileIcon } from "@/components/files/file-icon";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react"; // Import Heart icon
import { toast } from "@/hooks/use-toast"; // Import toast

interface FileCardProps {
  file: FileItem;
  onShare: () => void;
  onPreview: () => void;
  onDelete: (file: FileItem) => void; // Change to FileItem
  onMoveToGallery?: (file: FileItem) => void; // Change to FileItem
  onFavoriteToggle: (file: FileItem, inGallery: boolean) => void; // Change to FileItem, use inGallery
  onRename: (file: FileItem, newName: string) => void; // Change to FileItem
}

export function FileCard({ file, onShare, onPreview, onDelete, onMoveToGallery, onFavoriteToggle, onRename }: FileCardProps) {
  const [isHovering, setIsHovering] = useState(false);

  // Debugging: Log file name to see if it updates
  useEffect(() => {
    console.log(`FileCard: ${file.uniqueName} - Name: ${file.name}, Path: ${file.filePath}, Preview: ${file.previewImageUrl}`);
  }, [file]);

  const handleCardClick = () => {
    onPreview();
  };

  const handleMoveToGallery = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMoveToGallery) {
      onMoveToGallery(file);
    }
  };

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Determine the new favorite status based on the current file's favorite status
    // The parent component is responsible for handling the API call and re-fetching data.
    const newFavoriteStatus = !file.isFavorite;
    onFavoriteToggle(file, newFavoriteStatus);
  };

  return (
    <Card
      className={cn(
        "group overflow-hidden transition-all duration-200 hover:shadow-md",
        isHovering ? "ring-2 ring-primary/20" : ""
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div
        className="relative aspect-square cursor-pointer"
        onClick={handleCardClick}
      >
        {file.type.startsWith("video/") && isHovering ? (
          <video
            src={`${file.filePath}?v=${file.modifiedAt}`} // Add cache-busting
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full object-cover transition-all duration-200 group-hover:scale-105"
          />
        ) : file.previewImageUrl ? (
          <div className="h-full w-full overflow-hidden" style={{ position: 'relative' }}>
            <Image
              src={`${file.previewImageUrl}?v=${file.modifiedAt}`} // Add cache-busting
              alt={file.name}
              className="object-cover transition-all duration-200 group-hover:scale-105"
              fill
              priority
            />
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <FileIcon fileType={file.type} size={64} />
          </div>
        )}
      </div>
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 truncate">
            <p className="truncate text-sm font-medium" title={file.name}>
              {file.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatBytes(file.size)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Favorite Button */}
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleFavoriteToggle}
                  >
                    <Heart
                      className={cn(
                        "h-4 w-4",
                        file.isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"
                      )}
                    />
                    <span className="sr-only">{file.isFavorite ? "Remove from favorites" : "Add to favorites"}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{file.isFavorite ? "Remove from favorites" : "Add to favorites"}</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Add to Gallery Button (conditionally rendered) */}
            {!file.inGallery && (
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleMoveToGallery}
                    >
                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-image-plus"><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"/><line x1="16" x2="22" y1="5" y2="5"/><line x1="19" x2="19" y1="2" y2="8"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                      <span className="sr-only">Add to Gallery</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Add to Gallery</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

             <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      onShare();
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-share"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
                    <span className="sr-only">Share</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Share</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <FileActionMenu
              file={file}
              onShare={onShare}
              onPreview={onPreview}
              onDelete={() => onDelete(file)} // Pass the file object
              onRename={(uniqueName, newName) => onRename(file, newName)} // Pass the file object and new name
              onFavoriteToggle={(uniqueName, inGallery) => onFavoriteToggle(file, inGallery)} // Pass the file object and inGallery status
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
