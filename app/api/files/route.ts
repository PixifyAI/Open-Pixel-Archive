
import { NextResponse } from 'next/server';
import { readFile, writeFile, unlink, rename, access } from 'fs/promises';
import { constants } from 'fs';
import path from 'path';
import { User, FileItem } from '@/lib/types'; // Only import User and FileItem

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json'); // Still needed for user favorites/comments
const GALLERY_METADATA_FILE = path.join(process.cwd(), 'data', 'files.json'); // Public gallery
const ARCHIVE_METADATA_FILE = path.join(process.cwd(), 'data', 'archive.json'); // Private user archive
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

// Helper function to read users data (still needed for favorites/comments)
async function readUsersData(): Promise<User[]> {
  try {
    const content = await readFile(USERS_FILE, 'utf-8');
    return JSON.parse(content) as User[];
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return []; // Return empty array if file doesn't exist
    }
    console.error('Error reading users data:', error);
    throw error;
  }
}

// Helper function to write users data
async function writeUsersData(users: User[]): Promise<void> {
  await writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

// Helper function to read public gallery files
async function readGalleryFilesData(): Promise<FileItem[]> {
  try {
    const content = await readFile(GALLERY_METADATA_FILE, 'utf-8');
    return JSON.parse(content) as FileItem[];
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return [];
    }
    console.error('Error reading gallery files data:', error);
    throw error;
  }
}

// Helper function to write public gallery files
async function writeGalleryFilesData(files: FileItem[]): Promise<void> {
  await writeFile(GALLERY_METADATA_FILE, JSON.stringify(files, null, 2), 'utf-8');
}

// Helper function to read private archive files
async function readArchiveFilesData(): Promise<FileItem[]> {
  try {
    const content = await readFile(ARCHIVE_METADATA_FILE, 'utf-8');
    return JSON.parse(content) as FileItem[];
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return [];
    }
    console.error('Error reading archive files data:', error);
    throw error;
  }
}

// Helper function to write private archive files
async function writeArchiveFilesData(archive: FileItem[]): Promise<void> {
  await writeFile(ARCHIVE_METADATA_FILE, JSON.stringify(archive, null, 2), 'utf-8');
}

export async function GET(request: Request) {
  try {
    console.log('Received GET request for files');
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('search') || '';
    const uploaderId = searchParams.get('uploaderId'); // Can be null for public view
    const currentFolder = searchParams.get('currentFolder') || 'root';

    let filesToReturn: FileItem[] = [];

    if (uploaderId && uploaderId !== 'anonymous') {
      // Logged-in user's view (archive or favorited public files)
      const users = await readUsersData();
      const currentUser = users.find(u => u.id === uploaderId);

      if (!currentUser) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
      }

      if (currentFolder === "archive") {
        // Fetch user's private archive files
        let archiveFiles = await readArchiveFilesData();
        filesToReturn = archiveFiles.filter(file => file.uploaderId === uploaderId);
      } else if (currentFolder === "favorites") {
        // Fetch public gallery files favorited by this user
        let galleryFiles = await readGalleryFilesData();
        filesToReturn = galleryFiles.filter(file => currentUser.favoriteFileUniqueNames.includes(file.uniqueName));
      } else {
        // Default to gallery for logged-in users if not explicitly archive/favorites
        // This might need adjustment based on desired default behavior for logged-in users
        // For now, let's assume 'root' for logged-in users means their own gallery files (if any)
        // or public gallery if they don't have their own.
        // Given the prompt, "my archive" is private, "gallery" is public.
        // So, if uploaderId is present and not 'archive' or 'favorites', it should probably show public gallery.
        filesToReturn = await readGalleryFilesData();
      }

    } else {
      // Public view (gallery)
      filesToReturn = await readGalleryFilesData();
      // Filter out anonymous files that have passed their deletion date
      const now = new Date();
      filesToReturn = filesToReturn.filter(file => {
        if (file.uploaderId === 'anonymous' && file.deletionDate) {
          return new Date(file.deletionDate) > now;
        }
        return true;
      });
    }

    // Apply folder filters (for both public and private views)
    if (currentFolder === "images") {
      filesToReturn = filesToReturn.filter(file => file.type.startsWith("image/"));
    } else if (currentFolder === "videos") {
      filesToReturn = filesToReturn.filter(file => file.type.startsWith("video/"));
    } else if (currentFolder === "audio") {
      filesToReturn = filesToReturn.filter(file => file.type.startsWith("audio/"));
    }

    // Apply search query
    if (searchQuery) {
      filesToReturn = filesToReturn.filter(file =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    console.log(`Returning ${filesToReturn.length} files for folder ${currentFolder} and uploaderId ${uploaderId || 'public'}`);
    return NextResponse.json(filesToReturn);

  } catch (error: any) {
    console.error('Error fetching files:', error);
    return NextResponse.json({ message: 'Error fetching files' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    console.log('Received PATCH request for file');
    const { uniqueName, inGallery, isFavorite, uploaderId } = await request.json();

    if (!uniqueName) {
      return NextResponse.json({ message: 'Missing uniqueName' }, { status: 400 });
    }

    if (uploaderId && uploaderId !== 'anonymous') {
      // Logged-in user action (move to/from archive or toggle favorite on public file)
      const users = await readUsersData();
      const currentUserIndex = users.findIndex(u => u.id === uploaderId);

      if (currentUserIndex === -1) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
      }
      const currentUser = users[currentUserIndex];

      if (inGallery !== undefined) {
        // Move file between gallery and archive for this user
        let galleryFiles = await readGalleryFilesData();
        let archiveFiles = await readArchiveFilesData();

        let fileToMove: FileItem | undefined;
        let sourceArray: FileItem[];
        let destinationArray: FileItem[];
        let sourceFileWriteFunc: (files: FileItem[]) => Promise<void>;
        let destinationFileWriteFunc: (files: FileItem[]) => Promise<void>;

        if (inGallery) { // Moving TO gallery (from archive)
          sourceArray = archiveFiles;
          destinationArray = galleryFiles;
          sourceFileWriteFunc = writeArchiveFilesData;
          destinationFileWriteFunc = writeGalleryFilesData;
        } else { // Moving TO archive (from gallery)
          sourceArray = galleryFiles;
          destinationArray = archiveFiles;
          sourceFileWriteFunc = writeGalleryFilesData;
          destinationFileWriteFunc = writeArchiveFilesData;
        }

        const fileIndex = sourceArray.findIndex(file => file.uniqueName === uniqueName && file.uploaderId === uploaderId);

        if (fileIndex === -1) {
          return NextResponse.json({ message: 'File not found in source for this user' }, { status: 404 });
        }

        fileToMove = sourceArray[fileIndex];
        sourceArray.splice(fileIndex, 1); // Remove from source

        fileToMove.inGallery = inGallery; // Update inGallery status
        destinationArray.push(fileToMove); // Add to destination

        await sourceFileWriteFunc(sourceArray);
        await destinationFileWriteFunc(destinationArray);

        console.log(`File ${uniqueName} moved to ${inGallery ? 'gallery' : 'archive'} for user ${uploaderId}`);
        return NextResponse.json({ success: true, message: 'File status updated successfully' });

      } else if (isFavorite !== undefined) {
        // Toggle favorite status for a public gallery file
        let galleryFiles = await readGalleryFilesData();
        const fileIndex = galleryFiles.findIndex(file => file.uniqueName === uniqueName);

        if (fileIndex === -1) {
          return NextResponse.json({ message: 'Public file not found' }, { status: 404 });
        }

        galleryFiles[fileIndex].isFavorite = isFavorite;
        await writeGalleryFilesData(galleryFiles);

        // Update user's favoriteFileUniqueNames array
        if (isFavorite) {
          if (!currentUser.favoriteFileUniqueNames.includes(uniqueName)) {
            currentUser.favoriteFileUniqueNames.push(uniqueName);
          }
        } else {
          currentUser.favoriteFileUniqueNames = currentUser.favoriteFileUniqueNames.filter(fav => fav !== uniqueName);
        }
        users[currentUserIndex] = currentUser;
        await writeUsersData(users);

        console.log(`Public file ${uniqueName} isFavorite status updated to ${isFavorite} for user ${uploaderId}`);
        return NextResponse.json({ success: true, message: 'Public file favorite status updated successfully' });
      } else {
        return NextResponse.json({ message: 'Invalid patch operation' }, { status: 400 });
      }

    } else {
      // Anonymous user or public file action (only isFavorite toggle for public files)
      if (isFavorite === undefined) {
        return NextResponse.json({ message: 'Missing isFavorite status for public file' }, { status: 400 });
      }
      let galleryFiles = await readGalleryFilesData();
      const fileIndex = galleryFiles.findIndex(file => file.uniqueName === uniqueName);

      if (fileIndex === -1) {
        return NextResponse.json({ message: 'Public file not found' }, { status: 404 });
      }

      galleryFiles[fileIndex].isFavorite = isFavorite;
      await writeGalleryFilesData(galleryFiles);
      console.log(`Public file ${uniqueName} isFavorite status updated to ${isFavorite}`);
      return NextResponse.json({ success: true, message: 'Public file favorite status updated successfully' });
    }
  } catch (error: any) {
    console.error('Error patching file:', error);
    return NextResponse.json({ message: 'Error patching file' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    console.log('Received DELETE request');
    const { uniqueName, uploaderId: requestUploaderId } = await request.json(); // Rename uploaderId to avoid conflict

    if (!uniqueName) {
      return NextResponse.json({ message: 'Missing uniqueName' }, { status: 400 });
    }

    let fileToDelete: FileItem | undefined;
    let metadataArray: FileItem[] = [];
    let writeFunction: (files: FileItem[]) => Promise<void> = async () => { throw new Error("writeFunction not assigned"); };
    let fileIndex = -1;

    // First, try to find the file in gallery (public)
    let galleryFiles = await readGalleryFilesData();
    fileIndex = galleryFiles.findIndex(file => file.uniqueName === uniqueName);
    if (fileIndex !== -1) {
      fileToDelete = galleryFiles[fileIndex];
      metadataArray = galleryFiles;
      writeFunction = writeGalleryFilesData;
    }

    // If not found in gallery, and a logged-in user is requesting, try to find in archive (private)
    if (!fileToDelete && requestUploaderId && requestUploaderId !== 'anonymous') {
      let archiveFiles = await readArchiveFilesData();
      fileIndex = archiveFiles.findIndex(file => file.uniqueName === uniqueName && file.uploaderId === requestUploaderId);
      if (fileIndex !== -1) {
        fileToDelete = archiveFiles[fileIndex];
        metadataArray = archiveFiles;
        writeFunction = writeArchiveFilesData;
      }
    }

    if (!fileToDelete) {
      return NextResponse.json({ message: 'File not found' }, { status: 404 });
    }

    // --- Permission Check ---
    // A file can be deleted if:
    // 1. It's an anonymous file (uploaderId is undefined or 'anonymous')
    // 2. It's owned by the requesting user (fileToDelete.uploaderId === requestUploaderId)
    const isAnonymousFile = fileToDelete.uploaderId === undefined || fileToDelete.uploaderId === 'anonymous';
    const isOwnedByRequestingUser = requestUploaderId && requestUploaderId !== 'anonymous' && fileToDelete.uploaderId === requestUploaderId;

    if (!isAnonymousFile && !isOwnedByRequestingUser) {
      return NextResponse.json({ message: 'Permission denied: You can only delete your own files or anonymous public files.' }, { status: 403 });
    }

    // Also remove from user's favorites if it was a public file they favorited
    if (requestUploaderId && requestUploaderId !== 'anonymous') {
      const users = await readUsersData();
      const currentUserIndex = users.findIndex(u => u.id === requestUploaderId);
      if (currentUserIndex !== -1) {
        const currentUser = users[currentUserIndex];
        currentUser.favoriteFileUniqueNames = (currentUser.favoriteFileUniqueNames || []).filter(fav => fav !== uniqueName);
        await writeUsersData(users);
      }
    }

    // Attempt to delete file from filesystem first
    // Construct the filename on disk using uniqueName (UUID) and original name
    const fileNameOnDisk = `${fileToDelete.uniqueName}-${fileToDelete.name}`;
    const absoluteFilePath = path.join(UPLOADS_DIR, fileNameOnDisk);
    let fileSystemDeletionSuccessful = false;

    try {
      console.log(`Attempting to delete file from filesystem: ${absoluteFilePath}`);
      await access(absoluteFilePath, constants.F_OK); // Check if file exists
      await unlink(absoluteFilePath);
      console.log(`File successfully deleted from filesystem: ${absoluteFilePath}`);
      fileSystemDeletionSuccessful = true;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.warn(`File not found on filesystem, assuming already deleted or never existed: ${absoluteFilePath}`);
        fileSystemDeletionSuccessful = true; // Consider it successful if file doesn't exist
      } else {
        console.error(`Error deleting file from filesystem: ${absoluteFilePath}`, error);
        return NextResponse.json({ message: `Failed to delete file from storage: ${error.message}` }, { status: 500 });
      }
    }

    // Only proceed to delete metadata if file system deletion was successful or file didn't exist
    if (fileSystemDeletionSuccessful) {
      // Delete preview image if exists
      if (fileToDelete.previewImageUrl) {
        // The previewImageUrl will be in the format /uploads/uuid-preview-originalpreviewname.ext
        // We need to extract the filename part from the URL
        const previewFileNameOnDisk = path.basename(fileToDelete.previewImageUrl);
        const absolutePreviewImagePath = path.join(UPLOADS_DIR, previewFileNameOnDisk);
        try {
          console.log(`Attempting to delete preview image from filesystem: ${absolutePreviewImagePath}`);
          await access(absolutePreviewImagePath, constants.F_OK);
          await unlink(absolutePreviewImagePath);
          console.log(`Preview image successfully deleted from filesystem: ${absolutePreviewImagePath}`);
        } catch (error: any) {
          if (error.code === 'ENOENT') {
            console.warn(`Preview image not found on filesystem, assuming already deleted: ${absolutePreviewImagePath}`);
          } else {
            console.error(`Error deleting preview image from filesystem: ${absolutePreviewImagePath}`, error);
          }
        }
      }

      // Remove from metadata
      metadataArray.splice(fileIndex, 1);
      if (writeFunction) {
        await writeFunction(metadataArray);
      }
      console.log(`File ${uniqueName} metadata deleted successfully`);
      return NextResponse.json({ success: true, message: 'File deleted successfully' });
    } else {
      return NextResponse.json({ message: 'File system deletion failed, metadata not removed.' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Unhandled error in DELETE function:', error);
    return NextResponse.json({ message: `An unexpected error occurred during deletion: ${error.message}` }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    console.log('Received PUT request for file rename');
    const { uniqueName, newName, uploaderId } = await request.json();

    if (!uniqueName || !newName) {
      return NextResponse.json({ message: 'Missing uniqueName or newName' }, { status: 400 });
    }

    let fileToRename: FileItem | undefined;
    let metadataArray: FileItem[] = [];
    let writeFunction: (files: FileItem[]) => Promise<void> = async () => { throw new Error("writeFunction not assigned"); }; // Initialize
    let fileIndex = -1;

    if (uploaderId && uploaderId !== 'anonymous') {
      // Logged-in user renaming their own file (from gallery or archive)
      let galleryFiles = await readGalleryFilesData();
      let archiveFiles = await readArchiveFilesData();

      fileIndex = galleryFiles.findIndex(file => file.uniqueName === uniqueName && file.uploaderId === uploaderId);
      if (fileIndex !== -1) {
        fileToRename = galleryFiles[fileIndex];
        metadataArray = galleryFiles;
        writeFunction = writeGalleryFilesData;
      } else {
        fileIndex = archiveFiles.findIndex(file => file.uniqueName === uniqueName && file.uploaderId === uploaderId);
        if (fileIndex !== -1) {
          fileToRename = archiveFiles[fileIndex];
          metadataArray = archiveFiles;
          writeFunction = writeArchiveFilesData;
        }
      }

      if (!fileToRename) {
        return NextResponse.json({ message: 'File not found for this user' }, { status: 404 });
      }

    } else {
      // Anonymous user or public file being renamed
      let galleryFiles = await readGalleryFilesData();
      fileIndex = galleryFiles.findIndex(file => file.uniqueName === uniqueName);
      if (fileIndex !== -1) {
        fileToRename = galleryFiles[fileIndex];
        metadataArray = galleryFiles;
        writeFunction = writeGalleryFilesData;
      }

      if (!fileToRename) {
        return NextResponse.json({ message: 'Public file not found' }, { status: 404 });
      }
    }

    // Old file path on disk
    const oldFileNameOnDisk = `${fileToRename.uniqueName}-${fileToRename.name}`;
    const oldAbsolutePath = path.join(UPLOADS_DIR, oldFileNameOnDisk);

    // Determine new file name and extension
    const originalFileExtension = path.extname(fileToRename.name);
    let finalNewName = newName;
    // Check if the newName already has an extension
    if (!path.extname(newName)) {
      // If not, append the original extension
      finalNewName = `${newName}${originalFileExtension}`;
    }
    const newFileNameWithExtension = finalNewName;
    
    // New file path on disk
    const newFileNameOnDisk = `${fileToRename.uniqueName}-${newFileNameWithExtension}`;
    const newAbsolutePath = path.join(UPLOADS_DIR, newFileNameOnDisk);

    console.log(`DEBUG: fileToRename.uniqueName: ${fileToRename.uniqueName}`);
    console.log(`DEBUG: newFileNameWithExtension: ${newFileNameWithExtension}`);
    console.log(`DEBUG: newFileNameOnDisk (main): ${newFileNameOnDisk}`);

    try {
      await rename(oldAbsolutePath, newAbsolutePath);
      console.log(`File renamed on filesystem from ${oldAbsolutePath} to ${newAbsolutePath}`);
    } catch (error: any) {
      console.error(`Error renaming file on filesystem: ${oldAbsolutePath} to ${newAbsolutePath}`, error);
      return NextResponse.json({ message: 'Error renaming file on filesystem' }, { status: 500 });
    }

    // Update metadata
    metadataArray[fileIndex].name = newFileNameWithExtension; // Update original name
    metadataArray[fileIndex].filePath = `/uploads/${newFileNameOnDisk}`;
    metadataArray[fileIndex].url = `/uploads/${newFileNameOnDisk}`;
    metadataArray[fileIndex].modifiedAt = new Date().toISOString(); // Update modifiedAt for cache-busting

    // Handle preview image renaming
    // If it's an image file, its preview is the main file, so just update the metadata
    if (fileToRename.type.startsWith("image/")) {
        metadataArray[fileIndex].previewImageUrl = `/uploads/${newFileNameOnDisk}`;
    }
    // If it's a video/audio file with a separate preview, rename the preview file on disk
    else if (fileToRename.previewImageUrl) { // Only if previewImageUrl exists for non-images
      const oldPreviewFileNameOnDisk = path.basename(fileToRename.previewImageUrl);
      const oldPreviewAbsolutePath = path.join(UPLOADS_DIR, oldPreviewFileNameOnDisk);
      
      const previewExtension = path.extname(oldPreviewFileNameOnDisk); // Get extension from the actual preview file name
      const previewUuidPart = oldPreviewFileNameOnDisk.split('-')[0];
      const newPreviewFileNameOnDisk = `${previewUuidPart}-preview-${newName.replace(originalFileExtension, '')}${previewExtension}`; // Use newName for preview
      const newPreviewAbsolutePath = path.join(UPLOADS_DIR, newPreviewFileNameOnDisk);

      console.log(`DEBUG: oldPreviewFileNameOnDisk: ${oldPreviewFileNameOnDisk}`);
      console.log(`DEBUG: previewUuidPart: ${previewUuidPart}`);
      console.log(`DEBUG: newPreviewFileNameOnDisk (preview): ${newPreviewFileNameOnDisk}`);

      try {
        await rename(oldPreviewAbsolutePath, newPreviewAbsolutePath);
        metadataArray[fileIndex].previewImageUrl = `/uploads/${newPreviewFileNameOnDisk}`;
        console.log(`DEBUG: Final previewImageUrl in metadata: ${metadataArray[fileIndex].previewImageUrl}`);
        console.log(`Preview image renamed on filesystem from ${oldPreviewAbsolutePath} to ${newPreviewAbsolutePath}`);
      } catch (error: any) {
          console.error(`Error renaming preview image on filesystem: ${oldPreviewAbsolutePath} to ${newPreviewAbsolutePath}`, error);
      }
    }

    if (writeFunction) {
      await writeFunction(metadataArray);
    }
    console.log(`File ${fileToRename.uniqueName} renamed to ${newFileNameOnDisk}`);
    return NextResponse.json({ success: true, message: 'File renamed successfully', file: metadataArray[fileIndex] });

  } catch (error: any) {
    console.error('Error renaming file:', error);
    return NextResponse.json({ message: 'Error renaming file' }, { status: 500 });
  }
}
