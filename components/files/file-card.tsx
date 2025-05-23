"use client"

import { useState } from "react";
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
} from "@/components/ui/tooltip"; // Import tooltip components
import { Button } from "@/components/ui/button"; // Import Button

interface FileCardProps {
  file: FileItem;
  onShare: () => void;
  onPreview: () => void;
  onDelete: (filePath: string) => void; // Add onDelete prop
}

export function FileCard({ file, onShare, onPreview, onDelete }: FileCardProps) {
  console.log("FileCard received file:", file); // Add console log here
  const [isHovering, setIsHovering] = useState(false);

  const handleCardClick = () => {
    onPreview();
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
        {file.type.startsWith("image/") ? (
          <div className="h-full w-full overflow-hidden">
            <Image
              src={file.filePath}
              alt={file.name}
              className="object-cover transition-all duration-200 group-hover:scale-105"
              fill
              priority
            />
          </div>
        ) : file.type.startsWith("video/") && file.previewImageUrl ? ( // Check if type is video and preview image exists
          <div className="h-full w-full overflow-hidden">
             <Image
              src={file.previewImageUrl}
              alt={`${file.name} preview`}
              className="object-cover transition-all duration-200 group-hover:scale-105"
              fill
              priority
            />
          </div>
        ) : file.type.startsWith("video/") && !file.previewImageUrl ? ( // Check if type is video and no preview image exists
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <FileIcon fileType={file.type} size={64} />
          </div>
        ) : file.type.startsWith("audio/") && file.previewImageUrl ? ( // Check if type is audio and preview image exists
          <div className="h-full w-full overflow-hidden">
             <Image
              src={file.previewImageUrl}
              alt={`${file.name} preview`}
              className="object-cover transition-all duration-200 group-hover:scale-105"
              fill
              priority
            />
          </div>
        ) : ( // Check if type is not image, video, or audio, or is audio with no preview
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <FileIcon fileType={file.type} size={64} />
          </div>
        )}
      </div>
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 truncate"> {/* Added flex-1 to allow URL to truncate */}
            <p className="truncate text-sm font-medium" title={`http://localhost:3000${file.filePath}`}> {/* Display URL */}
              http://localhost:3000{file.filePath}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatBytes(file.size)}
            </p>
          </div>
          <div className="flex items-center gap-2"> {/* Container for share button and action menu */}
             <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent card click
                      onShare(); // Trigger the share functionality
                    }}
                  >
                    {/* Share icon */}
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
              onDelete={onDelete} // Pass onDelete prop
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
