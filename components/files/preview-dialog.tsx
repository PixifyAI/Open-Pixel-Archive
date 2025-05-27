"use client"

import { useState, useEffect } from "react";
import Image from "next/image";
import { FileItem, Comment } from "@/lib/types"; // Import Comment type
import { X, Download, Share } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileIcon } from "@/components/files/file-icon";
import { TextPreview } from "@/components/files/text-preview";
import { Textarea } from "@/components/ui/textarea"; // Import Textarea
import { Input } from "@/components/ui/input"; // Import Input
import { formatBytes, formatDate } from "@/lib/utils";

interface PreviewDialogProps {
  file: FileItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShare: () => void;
}

export function PreviewDialog({ file, open, onOpenChange, onShare }: PreviewDialogProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentContent, setNewCommentContent] = useState("");
  const [newCommentAuthor, setNewCommentAuthor] = useState("");

  const fetchComments = async (uniqueName: string) => {
    try {
      const response = await fetch(`/api/comments?fileUniqueName=${uniqueName}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments);
      } else {
        console.error("Failed to fetch comments:", response.statusText);
        setComments([]);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
      setComments([]);
    }
  };

  useEffect(() => {
    if (open && file?.uniqueName) {
      fetchComments(file.uniqueName);
    } else if (!open) {
      // Reset comments and input fields when dialog closes
      setComments([]);
      setNewCommentContent("");
      setNewCommentAuthor("");
    }
  }, [open, file?.uniqueName]);

  const handleAddComment = async () => {
    if (!newCommentContent.trim()) {
      alert("Comment cannot be empty.");
      return;
    }

    // Debugging: Log the values before sending the request
    console.log("Attempting to add comment with:", {
      fileUniqueName: file?.uniqueName,
      author: newCommentAuthor.trim() || "Anonymous",
      content: newCommentContent.trim(),
    });

    if (!file?.uniqueName) {
      console.error("file.uniqueName is missing when attempting to add comment.");
      alert("Cannot add comment: File identifier is missing.");
      return;
    }

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileUniqueName: file.uniqueName,
          author: newCommentAuthor.trim() || "Anonymous",
          content: newCommentContent.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments((prevComments) => [...prevComments, data.comment]);
        setNewCommentContent("");
        setNewCommentAuthor("");
      } else {
        console.error("Failed to add comment:", response.statusText);
        alert("Failed to add comment.");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Error adding comment.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            <FileIcon fileType={file.type} size={20} />
            <span>{file.name}</span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Preview of {file.name}
          </DialogDescription>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="flex-1 flex items-center justify-center overflow-hidden bg-muted/30 rounded-md">
          {file.type.startsWith("image/") ? (
            <div
              className="relative h-full w-full cursor-pointer"
              onClick={() => window.open(`http://localhost:3000${file.filePath}`, "_blank")}
            >
              <Image
                src={file.filePath}
                alt={file.name}
                className="object-contain"
                fill
              />
            </div>
          ) : file.type.startsWith("video/") ? (
            <div className="relative h-full w-full flex items-center justify-center">
              {file.previewImageUrl && (
                <Image
                  src={file.previewImageUrl}
                  alt={`${file.name} preview`}
                  className="object-contain absolute inset-0 w-full h-full"
                  fill
                />
              )}
              <video
                src={file.filePath}
                controls
                className="max-h-[60vh] max-w-full relative z-10"
                onError={(e) => console.error("Video playback error:", e)}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          ) : file.type.startsWith("audio/") ? (
            <div className="w-full p-6 flex flex-col items-center justify-center">
              {file.previewImageUrl && (
                 <div className="relative w-40 h-40 mb-4">
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
          ) : file.type.startsWith("text/") ? (
            <div className="relative h-full w-full overflow-auto p-4">
              <TextPreview filePath={file.filePath} />
            </div>
          ) : file.type === "application/pdf" ? (
            <div className="relative h-full w-full">
              <iframe src={file.filePath} className="w-full h-full" title={file.name}></iframe>
            </div>
          ) : (
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
              onClick={onShare}
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

        {/* Comments Section */}
        <div className="mt-6 border-t pt-4">
          <h3 className="text-lg font-semibold mb-3">Comments</h3>
          <div className="max-h-40 overflow-y-auto pr-2 mb-4">
            {comments.length === 0 ? (
              <p className="text-muted-foreground text-sm">No comments yet. Be the first to comment!</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="mb-3 p-3 bg-muted/20 rounded-md">
                  <p className="text-sm font-medium">{comment.author} <span className="text-muted-foreground text-xs ml-2">{formatDate(comment.timestamp)}</span></p>
                  <p className="text-sm mt-1">{comment.content}</p>
                </div>
              ))
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Textarea
              placeholder="Write a comment..."
              value={newCommentContent}
              onChange={(e) => setNewCommentContent(e.target.value)}
              rows={3}
            />
            <Input
              placeholder="Your name (optional)"
              value={newCommentAuthor}
              onChange={(e) => setNewCommentAuthor(e.target.value)}
            />
            <Button onClick={handleAddComment} className="self-end">
              Add Comment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
