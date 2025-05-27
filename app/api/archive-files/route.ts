import { NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { FileItem } from '@/lib/types';

const GALLERY_METADATA_FILE = path.join(process.cwd(), 'data', 'files.json');
const ARCHIVE_METADATA_FILE = path.join(process.cwd(), 'data', 'archive.json');

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Helper function to read public gallery files
async function readPublicFilesData(): Promise<FileItem[]> {
  try {
    const content = await readFile(GALLERY_METADATA_FILE, 'utf-8');
    return JSON.parse(content) as FileItem[];
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return [];
    }
    console.error('Error reading public files data:', error);
    throw error;
  }
}

// Helper function to write public gallery files
async function writePublicFilesData(files: FileItem[]): Promise<void> {
  await writeFile(GALLERY_METADATA_FILE, JSON.stringify(files, null, 2), 'utf-8');
}

// Helper function to read public archive files
async function readPublicArchiveData(): Promise<FileItem[]> {
  try {
    const content = await readFile(ARCHIVE_METADATA_FILE, 'utf-8');
    return JSON.parse(content) as FileItem[];
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return [];
    }
    console.error('Error reading public archive data:', error);
    throw error;
  }
}

// Helper function to write public archive files
async function writePublicArchiveData(archive: FileItem[]): Promise<void> {
  await writeFile(ARCHIVE_METADATA_FILE, JSON.stringify(archive, null, 2), 'utf-8');
}

export async function POST(request: Request) {
  try {
    console.log('Received POST request to archive file');
    const { uniqueName } = await request.json();

    if (!uniqueName) {
      return NextResponse.json({ message: 'Missing uniqueName' }, { status: 400 });
    }

    let publicFiles = await readPublicFilesData();
    let publicArchive = await readPublicArchiveData();

    const fileIndex = publicFiles.findIndex(file => file.uniqueName === uniqueName);

    if (fileIndex === -1) {
      return NextResponse.json({ message: 'File not found in gallery' }, { status: 404 });
    }

    const fileToArchive = publicFiles[fileIndex];
    publicFiles.splice(fileIndex, 1); // Remove from gallery

    // Add to archive if not already there
    if (!publicArchive.some(file => file.uniqueName === uniqueName)) {
      publicArchive.push({ ...fileToArchive, inGallery: false });
    }

    await writePublicFilesData(publicFiles);
    await writePublicArchiveData(publicArchive);

    console.log(`Public file ${uniqueName} moved to archive`);
    return NextResponse.json({ success: true, message: 'File moved to archive successfully' });
  } catch (error: any) {
    console.error('Error archiving file:', error);
    return NextResponse.json({ message: 'Error archiving file' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    console.log('Received DELETE request to unarchive file');
    const { uniqueName } = await request.json();

    if (!uniqueName) {
      return NextResponse.json({ message: 'Missing uniqueName' }, { status: 400 });
    }

    let publicFiles = await readPublicFilesData();
    let publicArchive = await readPublicArchiveData();

    const fileIndex = publicArchive.findIndex(file => file.uniqueName === uniqueName);

    if (fileIndex === -1) {
      return NextResponse.json({ message: 'File not found in archive' }, { status: 404 });
    }

    const fileToUnarchive = publicArchive[fileIndex];
    publicArchive.splice(fileIndex, 1); // Remove from archive

    // Add back to gallery if not already there
    if (!publicFiles.some(file => file.uniqueName === uniqueName)) {
      publicFiles.push({ ...fileToUnarchive, inGallery: true });
    }

    await writePublicFilesData(publicFiles);
    await writePublicArchiveData(publicArchive);

    console.log(`Public file ${uniqueName} moved back to gallery`);
    return NextResponse.json({ success: true, message: 'File moved to gallery successfully' });
  } catch (error: any) {
    console.error('Error unarchiving file:', error);
    return NextResponse.json({ message: 'Error unarchiving file' }, { status: 500 });
  }
}
