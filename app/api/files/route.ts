import { NextResponse } from 'next/server';
import { readFile, writeFile, unlink } from 'fs/promises';
import path from 'path';

const METADATA_FILE = path.join(process.cwd(), 'data', 'files.json');
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

export async function GET(request: Request) {
  try {
    console.log('Received request for file list');
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('search') || '';

    const metadataContent = await readFile(METADATA_FILE, 'utf-8');
    let metadata = JSON.parse(metadataContent);

    if (searchQuery) {
      metadata = metadata.filter((file: any) =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    console.log('File list read and parsed successfully');
    return NextResponse.json(metadata);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log('Metadata file not found, returning empty list');
      return NextResponse.json([]);
    } else if (error instanceof SyntaxError) {
      console.error('Syntax error reading file list, returning empty list:', error);
      return NextResponse.json([]); // Return empty list on SyntaxError
    }
    console.error('Error reading file list:', error);
    return NextResponse.json({ message: 'Error fetching file list' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    console.log('Received delete request');
    const { filePath } = await request.json();
    console.log('Received filePath:', filePath);

    if (!filePath) {
      console.log('No filePath provided for deletion');
      return NextResponse.json({ success: false, message: 'No filePath provided' }, { status: 400 });
    }

    let metadata = [];
    try {
      const metadataContent = await readFile(METADATA_FILE, 'utf-8');
      metadata = JSON.parse(metadataContent);
    } catch (readError: any) {
      if (readError.code === 'ENOENT') {
        console.log('Metadata file not found during deletion attempt');
        return NextResponse.json({ success: false, message: 'Metadata file not found' }, { status: 404 });
      }
      console.error('Error reading metadata file during deletion:', readError);
      return NextResponse.json({ success: false, message: 'Error reading metadata' }, { status: 500 });
    }

    const fileIndex = metadata.findIndex((file: any) => file.filePath === filePath);

    if (fileIndex === -1) {
      console.log(`File not found in metadata: ${filePath}`);
      return NextResponse.json({ success: false, message: 'File not found' }, { status: 404 });
    }

    const fileToDelete = metadata[fileIndex];

    // Check if there's a preview image and attempt to delete it
    if (fileToDelete.previewImageUrl) {
      const absolutePreviewImagePath = path.join(process.cwd(), 'public', 'uploads', path.basename(fileToDelete.previewImageUrl));
      console.log('Constructed absolutePreviewImagePath:', absolutePreviewImagePath);
      try {
        console.log(`Attempting to delete preview image from filesystem: ${absolutePreviewImagePath}`);
        await unlink(absolutePreviewImagePath);
        console.log('Preview image deleted from filesystem successfully');
      } catch (unlinkPreviewError: any) {
        console.error(`Error deleting preview image from filesystem: ${absolutePreviewImagePath}`, unlinkPreviewError);
        // Log the error but continue with deleting the main file and metadata
      }
    }

    const absoluteFilePath = path.join(process.cwd(), 'public', 'uploads', path.basename(fileToDelete.filePath));
    console.log('Constructed absoluteFilePath:', absoluteFilePath);

    try {
      console.log(`Attempting to delete main file from filesystem: ${absoluteFilePath}`);
      await unlink(absoluteFilePath);
      console.log('Main file deleted from filesystem successfully');
    } catch (unlinkError: any) {
      console.error(`Error deleting main file from filesystem: ${absoluteFilePath}`, unlinkError);
      // Continue to remove from metadata even if file system deletion fails?
      // For now, we'll return an error, but in a real app, you might decide differently.
      return NextResponse.json({ success: false, message: 'Error deleting main file from filesystem' }, { status: 500 });
    }

    metadata.splice(fileIndex, 1);

    try {
      await writeFile(METADATA_FILE, JSON.stringify(metadata, null, 2), 'utf-8');
      console.log('Metadata updated successfully after deletion');
    } catch (writeError) {
      console.error('Error writing metadata after deletion:', writeError);
      return NextResponse.json({ success: false, message: 'Error updating metadata' }, { status: 500 });
    }

    console.log(`File deleted successfully: ${filePath}`);
    return NextResponse.json({ success: true, message: 'File deleted successfully' });

  } catch (error: any) {
    console.error('Error during file deletion process:', error);
    return NextResponse.json({ success: false, message: `File deletion failed: ${error.message}` }, { status: 500 });
  }
}
