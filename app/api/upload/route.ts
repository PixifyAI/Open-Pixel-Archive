import { NextResponse } from 'next/server';
import { writeFile, mkdir, readFile } from 'fs/promises';
import path from 'path';

const METADATA_FILE = path.join(process.cwd(), 'data', 'files.json');
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads'); // Update upload directory

export const dynamic = 'force-dynamic'; // Ensure dynamic rendering
export const runtime = 'nodejs';
export const maxDuration = 300; // Increase max duration for file uploads

export async function POST(request: Request) {
  try {
    console.log('Received upload request');
    const formData = await request.formData();
    console.log('Parsed form data');
    const file = formData.get('file') as File;
    const previewImage = formData.get('previewImage') as File | null; // Get optional preview image

    if (!file) {
      console.log('No main file uploaded');
      return NextResponse.json({ success: false, message: 'No main file uploaded' }, { status: 400 });
    }

    console.log(`Processing main file: ${file.name}`);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    console.log('Read main file buffer');

    // Define the directory to save files
    console.log(`Ensuring upload directory exists: ${UPLOAD_DIR}`);
    await mkdir(UPLOAD_DIR, { recursive: true });
    console.log('Upload directory ensured');

    const filePath = path.join(UPLOAD_DIR, file.name);
    console.log(`Writing main file to: ${filePath}`);
    try {
      await writeFile(filePath, buffer as unknown as Uint8Array);
      console.log('Main file written successfully');
    } catch (writeError) {
      console.error('Error writing main file:', writeError);
      throw writeError; // Re-throw to be caught by the main catch block
    }

    let previewImageUrl: string | undefined = undefined;

    // Handle optional preview image for audio and video files
    if ((file.type.startsWith("audio/") || file.type.startsWith("video/")) && previewImage) {
      console.log(`Processing preview image: ${previewImage.name}`);
      const previewBytes = await previewImage.arrayBuffer();
      const previewBuffer = Buffer.from(previewBytes);
      console.log('Read preview image buffer');

      const previewImagePath = path.join(UPLOAD_DIR, previewImage.name);
      console.log(`Writing preview image to: ${previewImagePath}`);
      try {
        await writeFile(previewImagePath, previewBuffer as unknown as Uint8Array);
        console.log('Preview image written successfully');
        previewImageUrl = `/uploads/${previewImage.name}`; // Construct public URL for preview image
      } catch (writePreviewError) {
        console.error('Error writing preview image:', writePreviewError);
        // Continue without preview image if writing fails
      }
    }


    // Update JSON metadata file
    console.log(`Ensuring metadata directory exists: ${path.dirname(METADATA_FILE)}`);
    try {
      await mkdir(path.dirname(METADATA_FILE), { recursive: true }); // Ensure data directory exists
      console.log('Metadata directory ensured');
    } catch (mkdirError) {
      console.error('Error creating metadata directory:', mkdirError);
      throw mkdirError; // Re-throw to be caught by the main catch block
    }


    let metadata = [];
    try {
      console.log(`Reading metadata file: ${METADATA_FILE}`);
      const metadataContent = await readFile(METADATA_FILE, 'utf-8');
      metadata = JSON.parse(metadataContent);
      console.log('Metadata file read and parsed');
    } catch (readError: any) {
      if (readError.code === 'ENOENT') {
        console.log('Metadata file not found, initializing empty metadata');
        metadata = []; // Initialize as empty array
      } else if (readError instanceof SyntaxError) {
        console.error('Syntax error reading metadata file, initializing empty metadata:', readError);
        metadata = []; // Initialize as empty array on SyntaxError
      }
      else {
        console.error('Error reading metadata file:', readError);
        throw readError; // Re-throw other errors
      }
    }

    let newFileMetadata: any = {
      name: file.name,
      size: file.size,
      type: file.type,
      filePath: `/uploads/${file.name}`, // Store public URL path
      uploadDate: new Date().toISOString(),
    };

    if (previewImageUrl) {
      newFileMetadata.previewImageUrl = previewImageUrl;
    }

    // Check if a file with the same filePath already exists in metadata
    const existingFileIndex = metadata.findIndex((item: any) => item.filePath === newFileMetadata.filePath);

    if (existingFileIndex > -1) {
      // If file exists, update the existing entry
      metadata[existingFileIndex] = { ...metadata[existingFileIndex], ...newFileMetadata };
      console.log(`Updated existing file metadata for: ${file.name}`);
    } else {
      // If file does not exist, add a new entry
      metadata.push(newFileMetadata);
      console.log(`Added new file metadata for: ${file.name}`);
    }

    console.log(`Writing updated metadata to: ${METADATA_FILE}`);
    try {
      await writeFile(METADATA_FILE, JSON.stringify(metadata, null, 2), 'utf-8');
      console.log('Metadata file written successfully');
    } catch (writeMetadataError) {
      console.error('Error writing metadata file:', writeMetadataError);
      throw writeMetadataError; // Re-throw to be caught by the main catch block
    }


    return NextResponse.json({ success: true, message: 'File uploaded successfully', filePath });

  } catch (error: any) {
    console.error('Error during file upload process:', error);
    return NextResponse.json({ success: false, message: `File upload failed: ${error.message}` }, { status: 500 });
  }
}
