"use client"

import { useState, useRef } from 'react';
import { Cloud, File, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface UploadDropzoneProps {
  onUploadStart: () => void;
  onUploadComplete: (files: any[]) => void;
  children: React.ReactNode;
}

export function UploadDropzone({ 
  children, 
  onUploadStart, 
  onUploadComplete 
}: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleDragIn = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragOut = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  const handleFiles = (files: FileList) => {
    // Simulate upload process
    onUploadStart();
    
    toast({
      title: "Upload started",
      description: `${files.length} files are being uploaded.`,
    });
    
    // In a real app, this would handle the actual file upload
    // For this demo, we'll simulate successful uploads
    setTimeout(() => {
      const uploadedFiles = Array.from(files).map((file, index) => {
        const fileType = getFileType(file.type);
        return {
          id: `upload-${Date.now()}-${index}`,
          name: file.name,
          type: fileType,
          size: file.size,
          url: fileType === 'image' ? URL.createObjectURL(file) : '',
          modifiedAt: new Date().toISOString(),
          folder: 'recent'
        };
      });
      
      onUploadComplete(uploadedFiles);
      
      toast({
        title: "Upload complete",
        description: `${files.length} files have been uploaded successfully.`,
      });
    }, 1500);
  };

  const getFileType = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('application/pdf')) return 'pdf';
    if (mimeType.includes('text/plain') || mimeType.includes('document')) return 'document';
    if (mimeType.includes('zip') || mimeType.includes('compressed')) return 'archive';
    return 'document';
  };

  return (
    <div
      className="relative w-full h-full"
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}
      
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="rounded-lg border-2 border-dashed border-primary p-12 text-center animate-pulse">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Cloud className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Drop files to upload</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Drop anywhere to upload your files
            </p>
          </div>
        </div>
      )}
    </div>
  );
}