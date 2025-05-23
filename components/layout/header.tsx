"use client"

import Link from "next/link";
import { Upload, Search, Bell, Settings, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/theme/mode-toggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface HeaderProps {
  onSearch: (query: string) => void;
  onOpenUpload: () => void; // Add onOpenUpload prop
}

export function Header({ onSearch, onOpenUpload }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72">
          <nav className="flex flex-col gap-4 pt-4">
            <Link
              href="/"
              className="text-lg font-semibold tracking-tight"
            >
              Open Pixel Archive
            </Link>
            <Link
              href="/about"
              className="text-lg font-semibold tracking-tight"
            >
              About
            </Link>
            <div className="py-4">
              <Button onClick={onOpenUpload} className="w-full justify-start gap-2"> {/* Use onOpenUpload prop */}
                <Upload className="h-4 w-4" />
                Upload
              </Button>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
      <Link
        href="/"
        className="hidden items-center gap-2 md:flex"
      >
        <span className="text-lg font-semibold tracking-tight">
          Open Pixel Archive
        </span>
      </Link>
      <div className="ml-auto flex items-center gap-4">
        <form className="hidden md:flex-1 md:max-w-sm md:flex" onSubmit={handleSearchSubmit}>
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search files..."
              className="w-full pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
        <Button variant="default" size="sm" className="gap-1" onClick={onOpenUpload}> {/* Use onOpenUpload prop */}
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline-block">Upload</span>
        </Button>
        <Link
          href="/about"
          className="text-muted-foreground transition-colors hover:text-foreground hidden md:flex"
        >
          About
        </Link>
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
          <span className="sr-only">Settings</span>
        </Button>
        <ModeToggle />
      </div>
    </header>
  );
}
