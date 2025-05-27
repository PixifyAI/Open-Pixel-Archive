"use client"

import { useState } from "react";
import { FileItem } from "@/lib/types";
import { Check, Copy, Link, Mail, Clock, X } from "lucide-react";
import { FaTwitter, FaFacebook, FaEnvelope, FaTiktok, FaSnapchatGhost, FaInstagram } from "react-icons/fa";
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
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [password, setPassword] = useState<string>("");
  const [shareLink, setShareLink] = useState<string>(`https://openpixelarchive.com/share/${file.id}`);
  const [generatingLink, setGeneratingLink] = useState(false);

  const handleGenerateLink = async () => {
    setGeneratingLink(true);
    setCopied(false); // Reset copied state when generating new link

    try {
      const response = await fetch("/api/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileId: file.id,
          expiryDate: expiryEnabled ? expiryDate : null,
          password: passwordEnabled ? password : null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate share link.");
      }

      const data = await response.json();
      setShareLink(data.shareLink);
      
      toast({
        title: "Share link generated",
        description: "The new share link has been generated with your settings.",
      });

      // Automatically copy the new link after generation
      navigator.clipboard.writeText(data.shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

    } catch (error: any) {
      toast({
        title: "Error generating link",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingLink(false);
    }
  };

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
                value={shareLink} // Use value instead of defaultValue
                readOnly
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>
          <Button 
            size="sm" 
            type="submit" 
            onClick={expiryEnabled || passwordEnabled ? handleGenerateLink : handleCopy} 
            className="px-3"
            disabled={generatingLink}
          >
            <span className="sr-only">
              {expiryEnabled || passwordEnabled ? "Generate" : "Copy"}
            </span>
            {generatingLink ? (
              "Generating..."
            ) : copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
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
              onCheckedChange={(checked) => {
                setExpiryEnabled(checked);
                if (!checked) setExpiryDate(""); // Clear date if disabled
              }} 
            />
          </div>
          {expiryEnabled && (
            <div className="pl-6">
              <Input 
                type="date" 
                value={expiryDate} 
                onChange={(e) => setExpiryDate(e.target.value)} 
              />
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
              onCheckedChange={(checked) => {
                setPasswordEnabled(checked);
                if (!checked) setPassword(""); // Clear password if disabled
              }} 
            />
          </div>
          {passwordEnabled && (
            <div className="pl-6">
              <Input 
                type="password" 
                placeholder="Enter password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />
            </div>
          )}
          <div className="space-y-2">
            <div className="text-sm font-medium">Share directly</div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareLink)}&text=Check out this file!`, '_blank')}
              >
                <FaTwitter className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`, '_blank')}
              >
                <FaFacebook className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => window.open(`mailto:?subject=Check out this file&body=I wanted to share this file with you: ${encodeURIComponent(shareLink)}`, '_blank')}
              >
                <FaEnvelope className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => window.open(`https://www.tiktok.com/share/video?url=${encodeURIComponent(shareLink)}`, '_blank')}
              >
                <FaTiktok className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => window.open(`https://www.snapchat.com/share?url=${encodeURIComponent(shareLink)}`, '_blank')}
              >
                <FaSnapchatGhost className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => window.open(`https://www.instagram.com/share?url=${encodeURIComponent(shareLink)}`, '_blank')}
              >
                <FaInstagram className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button 
            type="submit" 
            onClick={expiryEnabled || passwordEnabled ? handleGenerateLink : handleCopy}
            disabled={generatingLink}
          >
            {generatingLink ? (
              "Generating..."
            ) : expiryEnabled || passwordEnabled ? (
              <>
                <Link className="mr-2 h-4 w-4" />
                Generate Link
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy Link
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
