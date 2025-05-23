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
  onDelete: (filePath: string) => void; // Add onDelete prop
}

export function FileActionMenu({ file, onShare, onPreview, onDelete }: FileActionMenuProps) {
  const handleCopyLink = () => {
    // In a real app, generate and copy the actual share link
    navigator.clipboard.writeText(`https://openpixelarchive.com/share/${file.id}`);
    toast({
      title: "Link copied to clipboard",
      description: `You can now share ${file.name} with anyone.`,
    });
  };

  const handleDownload = () => {
    // Initiate actual download
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name; // Suggest the original file name
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Download started",
      description: `${file.name} is being downloaded.`,
    });
  };

  const handleDelete = async () => {
    console.log('Attempting to delete file with filePath:', file.filePath);
    // Implement actual deletion
    try {
      const response = await fetch('/api/files', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filePath: file.filePath }),
      });

      if (response.ok) {
        toast({
          title: "File deleted",
          description: `${file.name} has been permanently deleted.`,
        });
        onDelete(file.filePath); // Call onDelete prop on success
      } else {
        const errorData = await response.json();
        console.error(`Error deleting file ${file.name}:`, errorData.message);
        toast({
          title: "Deletion failed",
          description: `Failed to delete ${file.name}: ${errorData.message}`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error(`Error deleting file ${file.name}:`, error);
      toast({
        title: "Deletion failed",
        description: `An error occurred while deleting ${file.name}.`,
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
          toast({
            title: "Feature not implemented",
            description: "Adding to favorites is not yet supported.",
          });
        }}>
          <Star className="mr-2 h-4 w-4" />
          Add to Favorites
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => {
          e.stopPropagation();
          toast({
            title: "Feature not implemented",
            description: "Renaming files is not yet supported.",
          });
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
