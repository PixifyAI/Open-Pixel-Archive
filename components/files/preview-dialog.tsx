"use client"

import { useState } from "react";
import Image from "next/image";
import { FileItem } from "@/lib/types";
import { X, ChevronLeft, ChevronRight, Download, Share } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileIcon } from "@/components/files/file-icon";
import { formatBytes, formatDate } from "@/lib/utils";

interface PreviewDialogProps {
  file: FileItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShare: () => void; // Add onShare prop
}

export function PreviewDialog({ file, open, onOpenChange, onShare }: PreviewDialogProps) { // Accept onShare prop
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            <FileIcon fileType={file.type} size={20} />
            <span>{file.name}</span>
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="flex-1 flex items-center justify-center overflow-hidden bg-muted/30 rounded-md">
          {file.type.startsWith("image/") && ( // Check if type starts with "image/"
            <div
              className="relative h-full w-full cursor-pointer" // Added cursor-pointer
              onClick={() => window.open(`http://localhost:3000${file.filePath}`, "_blank")} // Added onClick handler
            > {/* Simplified parent div with relative position */}
              <Image
                src={file.filePath}
                alt={file.name}
                className="object-contain"
                fill
              />
            </div>
          )}

          {/* Video preview logic */}
          {file.type.startsWith("video/") ? (
            <div className="relative h-full w-full flex items-center justify-center">
              {file.previewImageUrl && ( // Display preview image if exists
                <Image
                  src={file.previewImageUrl}
                  alt={`${file.name} preview`}
                  className="object-contain absolute inset-0 w-full h-full" // Position behind video
                  fill
                />
              )}
              <video
                src={file.filePath}
                controls
                className="max-h-[60vh] max-w-full relative z-10" // Position above image
                onError={(e) => console.error("Video playback error:", e)}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          ) : file.type.startsWith("audio/") ? ( // Check if type is audio
            <div className="w-full p-6 flex flex-col items-center justify-center">
              {file.previewImageUrl && ( // Display preview image if exists
                 <div className="relative w-40 h-40 mb-4"> {/* Container for audio preview image */}
                   <Image
                     src={file.previewImageUrl}
                     alt={`${file.name} preview`}
                     className="object-contain rounded-md"
                     fill
                   />
                 </div>
              )}
              <div className="bg-card rounded-md p-6 w-full max-w-md mx-auto">
                <div className="mb-6 flex justify-center">
                  <FileIcon fileType={file.type} size={64} />
                </div>
                <p className="text-center mb-4 font-medium">{file.name}</p>
                <audio
                  src={file.filePath}
                  controls
                  className="w-full"
                >
                  Your browser does not support the audio tag.
                </audio>
              </div>
            </div>
          ) : file.type.startsWith("image/") ? ( // Check if type starts with "image/"
            <div
              className="relative h-full w-full cursor-pointer" // Added cursor-pointer
              onClick={() => window.open(`http://localhost:3000${file.filePath}`, "_blank")} // Added onClick handler
            > {/* Simplified parent div with relative position */}
              <Image
                src={file.filePath}
                alt={file.name}
                className="object-contain"
                fill
              />
            </div>
          ) : ( // Check if type is not image, video, or audio
            <div className="text-center">
              <FileIcon fileType={file.type} size={80} />
              <p className="mt-4 font-medium">
                Preview not available
              </p>
              <p className="text-sm text-muted-foreground">
                Download the file to view it
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4 sm:justify-between">
          <div className="text-sm space-y-1">
            <p><span className="text-muted-foreground">Type:</span> {file.type.toUpperCase()}</p>
            <p><span className="text-muted-foreground">Size:</span> {formatBytes(file.size)}</p>
            <p><span className="text-muted-foreground">Modified:</span> {formatDate(file.modifiedAt)}</p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onShare} // Call the onShare prop
            >
              <Share className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button size="sm">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
