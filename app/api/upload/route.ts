import { NextResponse } from 'next/server';
import { writeFile, mkdir, readFile } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { FileItem } from '@/lib/types'; // Only import FileItem

const GALLERY_METADATA_FILE = path.join(process.cwd(), 'data', 'files.json'); // Public gallery
const ARCHIVE_METADATA_FILE = path.join(process.cwd(), 'data', 'archive.json'); // Private user archive
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

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

export async function POST(request: Request) {
  try {
    console.log('Received upload request');
    const formData = await request.formData();
    console.log('Parsed form data');
    const file = formData.get('file') as File;
    const previewImage = formData.get('previewImage') as File | null;
    const addToGallery = formData.get('addToGallery') === 'true';
    const uploaderId = formData.get('uploaderId') as string | null; // Can be null or 'anonymous-user'

    const uploaderIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || request.headers.get('remote-addr') || 'unknown';
    console.log(`Uploader IP: ${uploaderIp}`);

    if (!file) {
      console.log('No main file uploaded');
      return NextResponse.json({ success: false, message: 'No main file uploaded' }, { status: 400 });
    }

    console.log(`Processing main file: ${file.name}`);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    console.log('Read main file buffer');

    await mkdir(UPLOADS_DIR, { recursive: true });
    console.log('Upload directory ensured');

    const fileUuid = uuidv4();
    const fileNameOnDisk = `${fileUuid}-${file.name}`; // Store with UUID prefix for uniqueness
    const filePathOnDisk = path.join(UPLOADS_DIR, fileNameOnDisk);
    console.log(`Writing main file to: ${filePathOnDisk}`);
    try {
      await writeFile(filePathOnDisk, buffer as unknown as Uint8Array);
      console.log('Main file written successfully');
    } catch (writeError) {
      console.error('Error writing main file:', writeError);
      throw writeError;
    }

    let previewImageUrl: string | undefined = undefined;
    let previewFileNameOnDisk: string | undefined = undefined;

    if (file.type.startsWith("image/")) {
      previewImageUrl = `/uploads/${fileNameOnDisk}`; // If it's an image, its own file is the preview
    } else if ((file.type.startsWith("audio/") || file.type.startsWith("video/")) && previewImage) {
      console.log(`Processing preview image: ${previewImage.name}`);
      const previewBytes = await previewImage.arrayBuffer();
      const previewBuffer = Buffer.from(previewBytes);
      console.log('Read preview image buffer');

      const previewUuid = uuidv4();
      previewFileNameOnDisk = `${previewUuid}-preview-${previewImage.name}`; // Store with UUID prefix
      const previewImagePath = path.join(UPLOADS_DIR, previewFileNameOnDisk);
      console.log(`Writing preview image to: ${previewImagePath}`);
      try {
        await writeFile(previewImagePath, previewBuffer as unknown as Uint8Array);
        console.log('Preview image written successfully');
        previewImageUrl = `/uploads/${previewFileNameOnDisk}`;
      } catch (writePreviewError) {
        console.error('Error writing preview image:', writePreviewError);
      }
    }

    const newFileItem: FileItem = {
      id: uuidv4(), // Unique ID for the metadata entry
      name: file.name, // Original file name
      uniqueName: fileUuid, // Just the UUID
      type: file.type,
      size: file.size,
      url: `/uploads/${fileNameOnDisk}`, // Public URL path
      filePath: `/uploads/${fileNameOnDisk}`, // Full path on the server (relative to public)
      modifiedAt: new Date().toISOString(),
      folder: "root", // Default folder
      previewImageUrl: previewImageUrl,
      isFavorite: false, // Default for new uploads
      uploaderId: uploaderId === 'anonymous-user' ? undefined : uploaderId || undefined, // Set uploaderId or undefined
    };

    if (uploaderId && uploaderId !== 'anonymous-user') {
      // Logged-in user upload
      if (addToGallery) {
        let galleryFiles = await readGalleryFilesData();
        galleryFiles.push({ ...newFileItem, inGallery: true });
        await writeGalleryFilesData(galleryFiles);
        console.log(`Added new gallery file: ${file.name} by user ${uploaderId}`);
      } else {
        let archiveFiles = await readArchiveFilesData();
        archiveFiles.push({ ...newFileItem, inGallery: false }); // inGallery: false means it's in archive
        await writeArchiveFilesData(archiveFiles);
        console.log(`Added new archive file: ${file.name} by user ${uploaderId}`);
      }
      return NextResponse.json({ success: true, message: 'File uploaded successfully', filePath: newFileItem.filePath, uploaderId: newFileItem.uploaderId });

    } else {
      // Anonymous upload (always goes to gallery, temporary)
      let galleryFiles = await readGalleryFilesData();
      const oneMonthFromNow = new Date();
      oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

      galleryFiles.push({
        ...newFileItem,
        inGallery: true,
        uploaderId: 'anonymous',
        deletionDate: oneMonthFromNow.toISOString(),
      });
      await writeGalleryFilesData(galleryFiles);
      console.log(`Added new anonymous gallery file: ${file.name}`);
      return NextResponse.json({ success: true, message: 'File uploaded successfully', filePath: newFileItem.filePath, uploaderId: 'anonymous' });
    }

  } catch (error: any) {
    console.error('Error during file upload process:', error);
    return NextResponse.json({ success: false, message: `File upload failed: ${error.message}` }, { status: 500 });
  }
}
