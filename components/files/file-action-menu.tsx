"use client"

import {
  MoreHorizontal,
  Download,
  Trash2,
  Share,
  Pencil,
  Eye,
  Copy,
  Star,
} from "lucide-react";
import { FileItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";

interface FileActionMenuProps {
  file: FileItem;
  onShare: () => void;
  onPreview: () => void;
  onDelete: (uniqueName: string) => void;
  onRename: (uniqueName: string, newName: string) => void;
  onFavoriteToggle: (uniqueName: string, inGallery: boolean) => void;
}

export function FileActionMenu({ file, onShare, onPreview, onDelete, onRename, onFavoriteToggle }: FileActionMenuProps) {
  const getUploaderId = () => {
    return sessionStorage.getItem('userId') || "anonymous";
  };

  const handleFavoriteToggle = () => {
    // Toggle inGallery status
    onFavoriteToggle(file.uniqueName, !file.inGallery);
  };

  const handleCopyLink = () => {
    // In a real app, generate and copy the actual share link
    navigator.clipboard.writeText(`https://openpixelarchive.com/share/${file.uniqueName}`);
    toast({
      title: "Link copied to clipboard",
      description: `You can now share ${file.name} with anyone.`,
    });
  };

  const handleDownload = () => {
    // Initiate actual download
    const link = document.createElement('a');
    link.href = file.filePath; // Use filePath for download
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Download started",
      description: `${file.name} is being downloaded.`,
    });
  };

  const handleDelete = () => {
    // Delegate deletion to the onDelete prop provided by the parent component (MainDashboard)
    onDelete(file.uniqueName);
  };

  const handleRename = async () => {
    const newName = prompt(`Enter new name for ${file.name}:`, file.name);
    if (!newName || newName === file.name) {
      return;
    }

    try {
      const response = await fetch('/api/files', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uniqueName: file.uniqueName, newName, uploaderId: getUploaderId() }),
      });

      if (response.ok) {
        const updatedFile = await response.json();
        toast({
          title: "File renamed",
          description: `${file.name} renamed to ${updatedFile.newName}.`,
        });
        onRename(file.uniqueName, updatedFile.file.name); // Use updatedFile.file.name
      } else {
        const errorData = await response.json();
        console.error(`Error renaming file ${file.name}:`, errorData.message);
        toast({
          title: "Rename failed",
          description: `Failed to rename ${file.name}: ${errorData.message}`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error(`Error renaming file ${file.name}:`, error);
      toast({
          title: "Rename failed",
          description: `An error occurred while renaming ${file.name}.`,
          variant: "destructive",
        });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={(e) => {
          e.stopPropagation();
          onPreview();
        }}>
          <Eye className="mr-2 h-4 w-4" />
          Preview
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => {
          e.stopPropagation();
          handleCopyLink();
        }}>
          <Copy className="mr-2 h-4 w-4" />
          Copy Link
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => {
          e.stopPropagation();
          handleDownload();
        }}>
          <Download className="mr-2 h-4 w-4" />
          Download
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => {
          e.stopPropagation();
          handleFavoriteToggle();
        }}>
          <Star className="mr-2 h-4 w-4" />
          {file.inGallery ? "Move to Archive" : "Add to Gallery"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => {
          e.stopPropagation();
          handleRename();
        }}>
          <Pencil className="mr-2 h-4 w-4" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            handleDelete();
          }}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
