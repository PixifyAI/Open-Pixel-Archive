import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { FileItem } from "@/lib/types";

const filesDbPath = path.join(process.cwd(), "data", "files.json");

export async function POST(req: Request) {
  try {
    const { fileId, expiryDate, password } = await req.json();

    if (!fileId) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 });
    }

    const filesData = await fs.readFile(filesDbPath, "utf-8");
    let files: FileItem[] = JSON.parse(filesData);

    const fileIndex = files.findIndex((file) => file.id === fileId);

    if (fileIndex === -1) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const file = files[fileIndex];

    // Generate a unique share token
    const shareToken = uuidv4();
    const newShareLink = `https://openpixelarchive.com/share/${shareToken}`;

    // Update file properties
    file.shareLink = newShareLink;
    file.shareToken = shareToken; // Store the token for lookup
    file.shareExpiryDate = expiryDate;
    file.sharePassword = password;

    files[fileIndex] = file;

    await fs.writeFile(filesDbPath, JSON.stringify(files, null, 2));

    return NextResponse.json({ shareLink: newShareLink });
  } catch (error) {
    console.error("Error generating share link:", error);
    return NextResponse.json(
      { error: "Failed to generate share link" },
      { status: 500 }
    );
  }
}
