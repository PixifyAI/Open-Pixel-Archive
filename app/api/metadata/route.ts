import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get('filePath');

  if (!filePath) {
    return NextResponse.json({ error: 'File path is required' }, { status: 400 });
  }

  const absolutePath = path.join(process.cwd(), 'public', filePath);

  try {
    // Check if file exists
    await fs.access(absolutePath);

    // TODO: Implement metadata extraction logic here based on file type
    // For now, return dummy metadata
    const dummyMetadata = {
      "Make": "Dummy Camera Co.",
      "Model": "Dummy Model X",
      "DateTimeOriginal": "2023:10:26 10:30:00",
      "FileSize": "1.2 MB",
      "Dimensions": "1920x1080",
      "Duration": "00:01:30",
      "Codec": "H.264",
    };

    return NextResponse.json({ metadata: dummyMetadata });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    console.error('Error fetching metadata:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
