"use client"

import { FileText, FileImage, FileAudio, FileVideo, File, FileCode, FileArchive } from "lucide-react";

interface FileIconProps {
  fileType: string;
  size?: number;
}

export function FileIcon({ fileType, size = 40 }: FileIconProps) {
  const iconProps = {
    size: size,
    className: "text-muted-foreground",
  };

  if (fileType.startsWith("image/")) {
    return <FileImage {...iconProps} className="text-blue-500" />;
  } else if (fileType.startsWith("audio/")) {
    return <FileAudio {...iconProps} className="text-purple-500" />;
  } else if (fileType.startsWith("video/")) {
    return <FileVideo {...iconProps} className="text-red-500" />;
  } else if (fileType.startsWith("text/")) { // Assuming "document" refers to text-based documents
    return <FileText {...iconProps} className="text-green-500" />;
  } else if (fileType === "application/pdf") { // Specific check for PDF MIME type
    return <File {...iconProps} className="text-orange-500" />;
  } else if (fileType.startsWith("code/") || fileType.includes("json") || fileType.includes("xml")) { // Basic check for code-related types
     return <FileCode {...iconProps} className="text-cyan-500" />;
  } else if (fileType.includes("zip") || fileType.includes("tar") || fileType.includes("rar")) { // Basic check for archive types
     return <FileArchive {...iconProps} className="text-yellow-500" />;
  }
  else {
    return <File {...iconProps} />; // Default icon for unhandled types
  }
}
