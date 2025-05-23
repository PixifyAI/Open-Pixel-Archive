"use client"

import { useState, useMemo } from "react";
import { FileItem, FileViewMode } from "@/lib/types";
import { Grid2x2, List, MoreHorizontal, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { FileIcon } from "@/components/files/file-icon";
import { formatBytes, formatDate } from "@/lib/utils";
import { FileActionMenu } from "@/components/files/file-action-menu";
import { ShareDialog } from "@/components/files/share-dialog";
import { PreviewDialog } from "@/components/files/preview-dialog";

interface FileListProps {
  files: FileItem[];
  currentFolder: string;
  onViewModeChange: (mode: FileViewMode) => void;
  searchQuery: string; // Add searchQuery prop
  onDelete: (filePath: string) => void; // Add onDelete prop
}

export function FileList({ files, currentFolder, onViewModeChange, searchQuery, onDelete }: FileListProps) {
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: keyof FileItem | null; direction: "asc" | "desc" }>({ key: null, direction: "asc" });

  // Filter and sort files based on currentFolder, searchQuery, and sortConfig
  const sortedFiles = useMemo(() => {
    let sortableFiles = [...files];

    // Filtering
    sortableFiles = sortableFiles.filter(file => {
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

    // Sorting
    if (sortConfig.key !== null) {
      sortableFiles.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        // Handle potential undefined values during comparison
        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined) return sortConfig.direction === "asc" ? 1 : -1;
        if (bValue === undefined) return sortConfig.direction === "asc" ? -1 : 1;


        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableFiles;
  }, [files, currentFolder, searchQuery, sortConfig]);

  const handleSort = (key: keyof FileItem) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };
  
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
            ({sortedFiles.length} items)
          </span>
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onViewModeChange("grid")}
          >
            <Grid2x2 className="h-4 w-4" />
            <span className="sr-only">Grid view</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onViewModeChange("list")}
            className="bg-accent"
          >
            <List className="h-4 w-4" />
            <span className="sr-only">List view</span>
          </Button>
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[400px]">
                <Button variant="ghost" onClick={() => handleSort("name")}>
                  Name
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort("type")}>
                  Type
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort("size")}>
                  Size
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort("modifiedAt")}>
                  Modified
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedFiles.map((file) => (
              <TableRow
                key={file.id}
                onClick={() => handlePreview(file)}
                className="cursor-pointer"
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <FileIcon fileType={file.type} size={20} />
                    <span>{file.name}</span>
                  </div>
                </TableCell>
                <TableCell>{file.type.toUpperCase()}</TableCell>
                <TableCell>{formatBytes(file.size)}</TableCell>
                <TableCell>{formatDate(file.modifiedAt)}</TableCell>
                <TableCell className="text-right">
                  <FileActionMenu
                    file={file}
                    onShare={() => handleShare(file)}
                    onPreview={() => handlePreview(file)}
                    onDelete={onDelete}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
