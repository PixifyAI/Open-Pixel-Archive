"use client"

import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/theme/mode-toggle";

export function UserSettingsModal() {
  const handleClearCache = () => {
    // In a real app, this would clear local storage, cookies, etc.
    alert("Cache cleared! (This is a placeholder action)");
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>User Settings</DialogTitle>
        <DialogDescription>
          Manage your account settings and preferences here.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="theme-toggle">Dark Mode</Label>
          <ModeToggle />
        </div>

        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="notifications">Enable Notifications</Label>
          <Switch id="notifications" defaultChecked />
        </div>

        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="clear-cache">Clear Application Data</Label>
          <Button variant="outline" onClick={handleClearCache}>
            Clear Cache
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}
