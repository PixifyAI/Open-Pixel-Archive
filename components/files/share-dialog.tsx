"use client"

import { useState } from "react";
import { FileItem } from "@/lib/types";
import { Check, Copy, Link, Mail, Clock, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { FileIcon } from "@/components/files/file-icon";
import { toast } from "@/hooks/use-toast";

interface ShareDialogProps {
  file: FileItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareDialog({ file, open, onOpenChange }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const [expiryEnabled, setExpiryEnabled] = useState(false);
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  
  const shareLink = `https://openpixelarchive.com/share/${file.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    
    toast({
      title: "Link copied to clipboard",
      description: "Anyone with this link can access this file.",
    });
    
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share File</DialogTitle>
          <DialogDescription>
            Create a link to share "{file.name}" with anyone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-3 py-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-md border">
            <FileIcon fileType={file.type} size={24} />
          </div>
          <div className="text-sm">
            <p className="font-medium">{file.name}</p>
            <p className="text-muted-foreground">{file.type.toUpperCase()}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="link" className="sr-only">
              Link
            </Label>
            <div className="flex items-center border rounded-md pl-3">
              <Link className="h-4 w-4 text-muted-foreground" />
              <Input
                id="link"
                defaultValue={shareLink}
                readOnly
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>
          <Button size="sm" type="submit" onClick={handleCopy} className="px-3">
            <span className="sr-only">Copy</span>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <div className="space-y-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <p>Set expiry date</p>
                <p className="text-muted-foreground">Link will expire after this date</p>
              </div>
            </div>
            <Switch 
              checked={expiryEnabled} 
              onCheckedChange={setExpiryEnabled} 
            />
          </div>
          {expiryEnabled && (
            <div className="pl-6">
              <Input type="date" />
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <p>Protect with password</p>
                <p className="text-muted-foreground">Recipients will need a password to access</p>
              </div>
            </div>
            <Switch 
              checked={passwordEnabled} 
              onCheckedChange={setPasswordEnabled} 
            />
          </div>
          {passwordEnabled && (
            <div className="pl-6">
              <Input type="password" placeholder="Enter password" />
            </div>
          )}
        </div>
        <DialogFooter className="sm:justify-between">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button type="submit" onClick={handleCopy}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}