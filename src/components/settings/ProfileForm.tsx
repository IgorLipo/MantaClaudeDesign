import { useState } from "react";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { demoProfile, departmentOptions, timezoneOptions } from "@/data/mockSettings";
import { toast } from "sonner";

export function ProfileForm() {
  const [profile, setProfile] = useState(demoProfile);

  const handleSave = () => {
    toast.success("Profile saved!", {
      description: "Changes are not persisted in demo mode.",
    });
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
          <User className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Profile</h2>
          <p className="text-sm text-muted-foreground">Your personal information</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Avatar Placeholder */}
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center text-2xl font-medium text-muted-foreground">
            {profile.name.split(" ").map((n) => n[0]).join("")}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Profile Photo</p>
            <p className="text-xs text-muted-foreground">Avatar upload disabled in demo</p>
          </div>
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={profile.email}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">Email cannot be changed in demo mode</p>
        </div>

        {/* Department */}
        <div className="space-y-2">
          <Label>Department</Label>
          <Select
            value={profile.department.toLowerCase()}
            onValueChange={(value) => setProfile({ ...profile, department: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {departmentOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Timezone */}
        <div className="space-y-2">
          <Label>Timezone</Label>
          <Select
            value={profile.timezone}
            onValueChange={(value) => setProfile({ ...profile, timezone: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timezoneOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Save Button */}
        <div className="pt-4">
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </div>
    </div>
  );
}
