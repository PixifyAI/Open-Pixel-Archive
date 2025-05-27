"use client"

import { useState, useRef, useEffect } from "react";
import { Upload, File, X, Check, ImagePlus, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { v4 as uuidv4 } from 'uuid'; // Import uuid for generating IDs

interface UploadModalProps {
  onClose: () => void;
  onUploadComplete: () => void; // Add onUploadComplete prop
}

interface FileWithId {
  file: File;
  id: string;
  estimatedTimeRemaining: number; // in seconds
  uploadSpeed: number; // in bytes per second
  uploadedBytes: number;
  totalBytes: number;
  startTime: number;
}

export function UploadModal({ onClose, onUploadComplete }: UploadModalProps) {
  const [files, setFiles] = useState<FileWithId[]>([]); // Store files with unique IDs
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [completed, setCompleted] = useState<{[key: string]: boolean}>({});
  const [completedCount, setCompletedCount] = useState(0);
  const [addToGallery, setAddToGallery] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewImageInputRefs = useRef<{[key: string]: HTMLInputElement | null}>({}); // Ref for preview image inputs
  const [previewImages, setPreviewImages] = useState<{[key: string]: File | null}>({}); // State for preview images

  // Load gallery preference from localStorage on mount
  useEffect(() => {
    const savedPreference = localStorage.getItem('galleryPreference');
    if (savedPreference !== null) {
      setAddToGallery(savedPreference === 'true');
    }
  }, []);

  const handleGalleryPreference = (preference: boolean) => {
    setAddToGallery(preference);
    localStorage.setItem('galleryPreference', preference.toString());
    toast({
      title: preference ? "Added to gallery" : "Not added to gallery",
      description: preference
        ? "Files will be added to your gallery after upload"
        : "Files will not be added to your gallery",
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);

      const filesWithIds: FileWithId[] = selectedFiles.map(file => ({
        file,
        id: uuidv4(), // Generate unique ID for each file
        estimatedTimeRemaining: 0,
        uploadSpeed: 0,
        uploadedBytes: 0,
        totalBytes: file.size,
        startTime: 0,
      }));

      setFiles([...files, ...filesWithIds]); // Add files with IDs to state
      setCompletedCount(0); // Reset completed count when new files are selected

      // Initialize progress and completed states with unique IDs
      const newProgress = { ...uploadProgress };
      const newCompleted = { ...completed };
      const newPreviewImages = { ...previewImages };
      const newPreviewImageInputRefs = { ...previewImageInputRefs.current };

      filesWithIds.forEach(({ id }) => {
        newProgress[id] = 0;
        newCompleted[id] = false;
        newPreviewImages[id] = null;
        newPreviewImageInputRefs[id] = null;
      });

      setUploadProgress(newProgress);
      setCompleted(newCompleted);
      setPreviewImages(newPreviewImages);
      previewImageInputRefs.current = newPreviewImageInputRefs;

      // Clear the input value to allow selecting the same file again or prevent re-triggering
      e.target.value = '';
    }
  };

  const handlePreviewImageSelect = (e: React.ChangeEvent<HTMLInputElement>, fileId: string) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedImage = e.target.files[0];
      setPreviewImages(prev => ({
        ...prev,
        [fileId]: selectedImage
      }));
      // Clear the input value to allow selecting the same file again or prevent re-triggering
      e.target.value = '';
    }
  };

  const handleUpload = async () => {
    console.log("handleUpload function entered."); // Log at the beginning
    if (files.length === 0) return;
    if (addToGallery === null) {
      toast({
        title: "Gallery preference required",
        description: "Please choose whether to add files to your gallery",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setCompletedCount(0); // Reset completed count for the new upload

    // Filter out files that are being used as preview images
    const mainFilesToUpload = files.filter(({ file }) => {
      // Check if this file object is a value in the previewImages state
      return !Object.values(previewImages).some(previewFile => previewFile === file);
    });

    const uploadPromises = mainFilesToUpload.map(({ file, id }) => {
      return new Promise<void>((resolve, reject) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('addToGallery', addToGallery.toString());

        if (previewImages[id]) {
          formData.append('previewImage', previewImages[id] as File);
        }

        const uploaderId = sessionStorage.getItem('userId');
        if (uploaderId) {
          formData.append('uploaderId', uploaderId);
        } else {
          formData.append('uploaderId', 'anonymous-user');
        }

        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentCompleted = (event.loaded / event.total) * 100;
            setUploadProgress(prev => ({
              ...prev,
              [id]: percentCompleted
            }));

            setFiles(prevFiles => prevFiles.map(f => {
              if (f.id === id) {
                const currentTime = Date.now();
                const timeElapsed = (currentTime - f.startTime) / 1000; // in seconds
                const currentUploadSpeed = timeElapsed > 0 ? event.loaded / timeElapsed : 0; // bytes/second
                const remainingBytes = event.total - event.loaded;
                const estimatedTime = currentUploadSpeed > 0 ? remainingBytes / currentUploadSpeed : 0;

                return {
                  ...f,
                  uploadedBytes: event.loaded,
                  totalBytes: event.total,
                  uploadSpeed: currentUploadSpeed,
                  estimatedTimeRemaining: estimatedTime,
                };
              }
              return f;
            }));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const result = JSON.parse(xhr.responseText);
            console.log(`File ${file.name} uploaded successfully.`);

            if (result.userId) {
              sessionStorage.setItem('userId', result.userId);
              console.log(`Stored userId in session storage: ${result.userId}`);
            }

            setCompleted(prev => ({
              ...prev,
              [id]: true
            }));
            setCompletedCount(prev => prev + 1);
            setUploadProgress(prev => ({
              ...prev,
              [id]: 100
            }));
            resolve();
          } else {
            console.error(`Upload failed for file ${file.name}. Status: ${xhr.status}, Response: ${xhr.responseText}`);
            toast({
              title: "Upload failed",
              description: `Failed to upload ${file.name}.`,
              variant: "destructive",
            });
            setCompleted(prev => ({
              ...prev,
              [id]: false
            }));
            setUploadProgress(prev => ({
              ...prev,
              [id]: 0
            }));
            reject(new Error(xhr.statusText));
          }
        };

        xhr.onerror = () => {
          console.error(`Network error uploading file ${file.name}.`);
          toast({
            title: "Upload failed",
            description: `Failed to upload ${file.name} due to a network error.`,
            variant: "destructive",
          });
          setCompleted(prev => ({
            ...prev,
            [id]: false
          }));
          setUploadProgress(prev => ({
            ...prev,
            [id]: 0
          }));
          reject(new Error("Network error"));
        };

        xhr.open('POST', '/api/upload');
        xhr.send(formData);

        // Set start time for the file
        setFiles(prevFiles => prevFiles.map(f => f.id === id ? { ...f, startTime: Date.now() } : f));
      });
    });

    await Promise.allSettled(uploadPromises); // Use Promise.allSettled to wait for all promises regardless of success/failure
    console.log("All upload promises settled.");

    setUploading(false);

    const allSuccessful = Object.values(completed).every(value => value);
    if (allSuccessful && files.length > 0) {
      toast({
        title: "Upload complete",
        description: `Files have been uploaded successfully${addToGallery ? ' and added to your gallery' : ''}.`,
      });
    }

    console.log("Upload process completed, closing modal and triggering gallery refresh.");
    onClose();
    onUploadComplete();
  };

  const handleRemoveFile = (id: string) => { // Accept unique ID
    const newFiles = files.filter(file => file.id !== id); // Filter by unique ID
    setFiles(newFiles);

    // Also remove the associated preview image and input ref if they exist
    setPreviewImages(prev => {
      const newState = { ...prev };
      delete newState[id]; // Use unique ID
      return newState;
    });
    if (previewImageInputRefs.current[id]) { // Use unique ID
      delete previewImageInputRefs.current[id]; // Use unique ID
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const formatTime = (seconds: number) => {
    if (seconds === 0 || !isFinite(seconds)) return '0s';
    const s = Math.floor(seconds % 60);
    const m = Math.floor((seconds / 60) % 60);
    const h = Math.floor(seconds / 3600);

    let timeString = '';
    if (h > 0) timeString += `${h}h `;
    if (m > 0) timeString += `${m}m `;
    timeString += `${s}s`;
    return timeString.trim();
  };

  return (
    <DialogContent className="sm:max-w-md" aria-labelledby="upload-dialog-title" aria-describedby="upload-dialog-description">
      <DialogTitle id="upload-dialog-title">Upload Files</DialogTitle>
      <DialogDescription id="upload-dialog-description">
        Upload your files to the archive.
      </DialogDescription>
      <DialogHeader>
      </DialogHeader>

      <div className="space-y-4">
        <div className="flex flex-col items-center space-y-2">
          <div className="rounded-full bg-primary/10 p-3">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Drag and drop your files here or click to browse
          </p>
        </div>

        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center ${
            files.length > 0 ? 'border-muted' : 'border-primary/40'
          }`}
          onClick={!uploading ? triggerFileInput : undefined}
          onDragOver={(e) => {
            e.preventDefault(); // Prevent default to allow drop
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault(); // Prevent default file open behavior
            e.stopPropagation();
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              const selectedFiles = Array.from(e.dataTransfer.files);
              const filesWithIds: FileWithId[] = selectedFiles.map(file => ({
                file,
                id: uuidv4(), // Generate unique ID for each file
                estimatedTimeRemaining: 0,
                uploadSpeed: 0,
                uploadedBytes: 0,
                totalBytes: file.size,
                startTime: 0,
              }));
              setFiles(prevFiles => [...prevFiles, ...filesWithIds]);
              setCompletedCount(0); // Reset completed count when new files are selected

              // Initialize progress and completed states with unique IDs
              const newProgress = { ...uploadProgress };
              const newCompleted = { ...completed };
              const newPreviewImages = { ...previewImages };
              const newPreviewImageInputRefs = { ...previewImageInputRefs.current };

              filesWithIds.forEach(({ id }) => {
                newProgress[id] = 0;
                newCompleted[id] = false;
                newPreviewImages[id] = null;
                newPreviewImageInputRefs[id] = null;
              });

              setUploadProgress(newProgress);
              setCompleted(newCompleted);
              setPreviewImages(newPreviewImages);
              previewImageInputRefs.current = newPreviewImageInputRefs;
            }
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            className="hidden"
            disabled={uploading}
          />

          {files.length === 0 ? (
            <div className="py-4 cursor-pointer">
              <File className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p>
                <span className="font-medium text-primary">Click to upload</span> or
                drag and drop
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Support for images, videos, audio, documents, and more
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-auto py-2">
              {files.map(({ file, id, estimatedTimeRemaining, uploadSpeed }, index) => { // Destructure file and id
                const progress = uploadProgress[id] || 0; // Use unique ID
                const isComplete = completed[id] || false; // Use unique ID

                return (
                  <div key={id} className="flex items-center justify-between bg-muted/50 rounded p-2"> {/* Use unique ID as key */}
                    <div className="flex items-center space-x-2 overflow-hidden">
                      <File className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                      <span className="text-sm truncate max-w-[180px]">{file.name}</span>

                      {/* Add preview image option for audio and video files */}
                      {(file.type.startsWith("audio/") || file.type.startsWith("video/")) && (
                        <div
                          className="flex items-center space-x-1 ml-2"
                          onClick={(e) => e.stopPropagation()} // Stop propagation from this div
                        >
                          <input
                            type="file"
                            accept="image/*"
                            ref={el => previewImageInputRefs.current[id] = el} // Use unique ID
                            onChange={(e) => handlePreviewImageSelect(e, id)} // Pass unique ID
                            className="hidden"
                            disabled={uploading}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full text-muted-foreground"
                            onClick={(e) => {
                              e.stopPropagation(); // This stops propagation from the button
                              previewImageInputRefs.current[id]?.click(); // Use unique ID
                            }}
                            disabled={uploading}
                            title={previewImages[id] ? "Change preview image" : "Add preview image"} // Use unique ID
                          >
                            {previewImages[id] ? ( // Use unique ID
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <ImagePlus className="h-4 w-4" />
                            )}
                          </Button>
                           {previewImages[id] && ( // Use unique ID
                             <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                               {previewImages[id]?.name} // Use unique ID
                             </span>
                           )}
                        </div>
                      )}
                    </div>

                    {!uploading ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(id); // Pass unique ID
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    ) : (
                      <div className="flex flex-col items-end">
                        {isComplete ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <>
                            <span className="text-xs text-muted-foreground">
                              {Math.round(progress)}%
                            </span>
                            {progress > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {formatTime(estimatedTimeRemaining)} remaining
                              </span>
                            )}
                            {progress > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {formatBytes(uploadSpeed)}/s
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {files.length > 0 && (
          <div className="space-y-4">
            {uploading && (
              <Progress value={
                Object.values(uploadProgress).reduce((sum, value) => sum + value, 0) /
                (Object.values(uploadProgress).length * 100) * 100
              } />
            )}

            {!uploading && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Would you like to add these files to gallery?
                </p>
                <div className="flex gap-2">
                  <Button
                    variant={addToGallery === true ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => handleGalleryPreference(true)}
                    disabled={uploading}
                  >
                    <ImagePlus className="mr-2 h-4 w-4" />
                    Add to Gallery
                  </Button>
                  <Button
                    variant={addToGallery === false ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => handleGalleryPreference(false)}
                    disabled={uploading}
                  >
                    <ImageOff className="mr-2 h-4 w-4" />
                    Don't Add
                  </Button>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={uploading || files.length === 0 || addToGallery === null}
              >
                {uploading ? 'Uploading...' : 'Upload Files'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </DialogContent>
  );
}
