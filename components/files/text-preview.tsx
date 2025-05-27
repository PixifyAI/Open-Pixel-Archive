"use client"

import { useState, useEffect } from "react";

interface TextPreviewProps {
  filePath: string;
}

export function TextPreview({ filePath }: TextPreviewProps) {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchText = async () => {
      try {
        const response = await fetch(filePath);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.text();
        setText(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchText();
  }, [filePath]);

  if (loading) {
    return <div>Loading text preview...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error loading text preview: {error}</div>;
  }

  return (
    <pre className="whitespace-pre-wrap break-words h-full overflow-auto">{text}</pre>
  );
}
