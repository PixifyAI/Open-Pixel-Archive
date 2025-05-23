"use client"

import { useState, useEffect } from "react"; // Import useEffect
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { FileGrid } from "@/components/files/file-grid";
import { FileList } from "@/components/files/file-list";
import { UploadDropzone } from "@/components/upload/upload-dropzone";
import { FileViewMode, FileItem } from "@/lib/types"; // Import FileItem
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"; // Import Dialog components
import { UploadModal } from "@/components/upload/upload-modal"; // Import UploadModal
// import { demoFiles } from "@/lib/demo-data"; // Remove demoFiles import


export function MainDashboard() {
  const [viewMode, setViewMode] = useState<FileViewMode>("grid");
  const [currentFolder, setCurrentFolder] = useState("root");
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false); // Add state for upload modal
  const [files, setFiles] = useState<FileItem[]>([]); // Initialize files as empty array
  const [searchQuery, setSearchQuery] = useState(""); // Add state for search query

  // Function to fetch files from the backend
  const fetchFiles = async (query = "") => { // Accept optional query parameter
    console.log("Fetching files with query:", query); // Add console log
    try {
      const url = query ? `/api/files?search=${encodeURIComponent(query)}` : '/api/files';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched files data:", data); // Add console log
        // Map backend data to FileItem format
        const formattedFiles: FileItem[] = data.map((file: any) => ({
          id: file.filePath, // Use filePath as the unique ID
          name: file.name,
          type: file.type,
          size: file.size,
          url: `/uploads/${file.name}`, // Construct public URL
          filePath: file.filePath, // Include filePath from backend data
          modifiedAt: file.uploadDate, // Map uploadDate to modifiedAt
          folder: "root", // Set a default folder
          previewImageUrl: file.previewImageUrl, // Include previewImageUrl
        }));
        setFiles(formattedFiles);
      } else {
        console.error('Error fetching files:', response.statusText);
        setFiles([]); // Set empty array on error
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      setFiles([]); // Set empty array on error
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    fetchFiles(query); // Fetch files with the new search query
  };

  // Fetch files on component mount and when searchQuery changes
  useEffect(() => {
    fetchFiles(searchQuery);
  }, [searchQuery]); // Add searchQuery to dependency array

  const handleViewModeChange = (mode: FileViewMode) => {
    setViewMode(mode);
  };

  const handleFolderChange = (folderId: string) => {
    setCurrentFolder(folderId);
  };

  const handleUploadStart = () => {
    setIsUploading(true);
  };

  const handleUploadComplete = () => { // No need to receive newFiles here
    setIsUploading(false);
    fetchFiles(searchQuery); // Refetch files after upload is complete, maintaining search query
  };

  const handleDeleteFile = async (filePath: string) => {
    // Call the backend delete API
    try {
      const response = await fetch('/api/files', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filePath }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Error deleting file ${filePath}:`, errorData.message);
        // Optionally show a toast or other error indicator
      }
    } catch (error) {
      console.error(`Error deleting file ${filePath}:`, error);
      // Optionally show a toast or other error indicator
    } finally {
      // Always refetch files after a delete attempt
      fetchFiles(searchQuery);
    }
  };

  // Calculate total storage used
  const totalStorageUsed = files.reduce((sum, file) => sum + file.size, 0);

  return (
    <div className="flex h-screen flex-col">
      <Header onSearch={handleSearch} onOpenUpload={() => setIsUploadOpen(true)} /> {/* Pass handleSearch and onOpenUpload to Header */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentFolder={currentFolder}
          onFolderChange={handleFolderChange}
          onOpenUpload={() => setIsUploadOpen(true)} // Pass function to open upload modal
          totalStorageUsed={totalStorageUsed} // Pass the calculated total storage used
        />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <UploadDropzone
            onUploadStart={handleUploadStart}
            onUploadComplete={handleUploadComplete}
          >
            <div className="space-y-6">
              {viewMode === "grid" ? (
                <FileGrid
                  files={files} // Pass full files array
                  currentFolder={currentFolder}
                  onViewModeChange={handleViewModeChange}
                  searchQuery={searchQuery}
                  onDelete={handleDeleteFile} // Pass handleDeleteFile
                />
              ) : (
                <FileList
                  files={files} // Pass full files array
                  currentFolder={currentFolder}
                  onViewModeChange={handleViewModeChange}
                  searchQuery={searchQuery}
                  onDelete={handleDeleteFile} // Pass handleDeleteFile
                />
              )}
            </div>
          </UploadDropzone>
        </main>
      </div>
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <UploadModal 
            onClose={() => setIsUploadOpen(false)} 
            onUploadComplete={handleUploadComplete} // Pass handleUploadComplete
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
