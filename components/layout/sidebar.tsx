"use client"

import Link from "next/link"; // Import Link
import {
  FolderIcon,
  Heart,
  Image,
  Music,
  FileVideo,
  Clock,
  Trash2,
  UploadCloud,
  PlusCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePathname } from "next/navigation"; // Import usePathname
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, formatBytes } from "@/lib/utils"; // Import formatBytes

interface SidebarProps {
  currentFolder: string;
  onFolderChange: (folderId: string) => void;
  onOpenUpload: () => void; // Add onOpenUpload prop
  totalStorageUsed: number; // Add totalStorageUsed prop
}

export function Sidebar({ currentFolder, onFolderChange, onOpenUpload, totalStorageUsed }: SidebarProps) {
  const pathname = usePathname();

  const folders = [
    { id: "root", name: "All Files", icon: FolderIcon, href: "/" }, // Add href for navigation
    { id: "images", name: "Images", icon: Image },
    { id: "videos", name: "Videos", icon: FileVideo },
    { id: "audio", name: "Audio", icon: Music },
    { id: "favorites", name: "Favorites", icon: Heart, href: "/favorites" }, // Add href for favorites page
  ];

  const totalStorageCapacity = 1000000 * 1024 * 1024 * 1024; // 1 TB in bytes
  const storageUsedPercentage = (totalStorageUsed / totalStorageCapacity) * 100;

  return (
    <aside className="hidden w-64 flex-col border-r bg-muted/40 md:flex">
      <div className="flex h-14 items-center border-b px-4">
        <h2 className="text-lg font-semibold tracking-tight">Files</h2>
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-auto h-8 w-8">
                <PlusCircle className="h-4 w-4" />
                <span className="sr-only">Create folder</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Create folder</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <ScrollArea className="flex-1">
        <div className="px-2 py-2">
          <Button
            variant="ghost"
            size="lg"
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={onOpenUpload}
          >
            <UploadCloud className="h-5 w-5" />
            Upload Files
          </Button>
        </div>
        <nav className="grid gap-1 px-2 group-[.active]:bg-accent">
          {folders.map((folder) => (
            folder.href ? ( // Render as Link if href exists
              <Link key={folder.id} href={folder.href} passHref>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-2 font-normal",
                    pathname === folder.href && "bg-accent" // Apply bg-accent if active
                  )}
                >
                  <folder.icon className="h-4 w-4" />
                  {folder.name}
                </Button>
              </Link>
            ) : ( // Render as Button if no href (for filtering within a page)
              <Button
                key={folder.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-2 font-normal",
                  currentFolder === folder.id && "bg-accent"
                )}
                onClick={() => onFolderChange(folder.id)}
              >
                <folder.icon className="h-4 w-4" />
                {folder.name}
              </Button>
            )
          ))}
          {/* My Archive link */}
          <Link href="/archive" passHref>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-2 font-normal",
                pathname === "/archive" && "bg-accent" // Apply bg-accent if active
              )}
            >
              <FolderIcon className="h-4 w-4" />
              My Archive
            </Button>
          </Link>
        </nav>
      </ScrollArea>
      <div className="p-4 mt-auto">
        <Link href="/donate" className="block mb-4">
          <Button variant="ghost" size="lg" className="w-full justify-start gap-2 text-muted-foreground">
            <Heart className="h-5 w-5" />
            Donate
          </Button>
        </Link>
        <div className="rounded-lg bg-muted p-4">
          <div className="flex items-center gap-2 mb-2">
            <UploadCloud className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Storage</span>
          </div>
          <div className="space-y-2">
            <div className="h-2 rounded-full bg-secondary">
              <div
                className="h-2 rounded-full bg-primary"
                style={{ width: `${storageUsedPercentage}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {formatBytes(totalStorageUsed)} of {formatBytes(totalStorageCapacity)} used
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
