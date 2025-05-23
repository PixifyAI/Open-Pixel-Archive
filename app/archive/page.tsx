"use client"

import { useState, useEffect } from "react"; // Import useState and useEffect
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { FileGrid } from "@/components/files/file-grid";
import { FileItem } from "@/lib/types";

async function getFiles(): Promise<FileItem[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/files`, {
    cache: "no-store",
  });
  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error("Failed to fetch data");
  }
  return res.json();
}

export default function ArchivePage() {
  const [files, setFiles] = useState<FileItem[]>([]); // Use state for files

  // Fetch files on component mount
  useEffect(() => {
    const fetchFilesData = async () => {
      const filesData = await getFiles();
      setFiles(filesData);
    };
    fetchFilesData();
  }, []); // Empty dependency array to fetch only on mount

  // Calculate total storage used
  const totalStorageUsed = files.reduce((sum, file) => sum + file.size, 0);

  return (
    <div className="flex h-screen flex-col">
      <Header onSearch={() => {}} onOpenUpload={() => {}} /> {/* Dummy functions for Header props */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentFolder="archive" // Provide a default folder for archive
          onFolderChange={() => {}} // Dummy function
          onOpenUpload={() => {}} // Dummy function
          totalStorageUsed={totalStorageUsed} // Pass the calculated total storage used
        />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="space-y-6">
            <h1 className="text-2xl font-semibold mb-4">My Archive</h1>
            <FileGrid
              files={files}
              currentFolder="root" // Provide a default folder for FileGrid filtering
              onViewModeChange={() => {}} // Dummy function
              searchQuery="" // Empty search query
              onDelete={() => {}} // Dummy function
            />
          </div>
        </main>
      </div>
    </div>
  );
}
