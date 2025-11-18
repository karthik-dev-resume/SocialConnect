"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/hooks/use-auth";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { apiRequest, apiRequestFormData } from "@/lib/api/client";
import { toast } from "sonner";
import { Camera } from "lucide-react";

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    bio: "",
    website: "",
    location: "",
    profile_visibility: "public" as "public" | "private" | "followers_only",
  });
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        bio: user.bio || "",
        website: user.website || "",
        location: user.location || "",
        profile_visibility: user.profile_visibility || "public",
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiRequest("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify(formData),
      });
      toast.success("Profile updated successfully!");
      refreshUser();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update profile";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      toast.error("Only JPEG and PNG images are allowed");
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB");
      return;
    }

    setAvatarLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      await apiRequestFormData("/api/users/upload-avatar", formData);
      toast.success("Avatar updated successfully!");
      refreshUser();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to upload avatar";

      // Provide helpful message for bucket not found error
      if (errorMessage.toLowerCase().includes("bucket not found")) {
        toast.error(
          "Storage bucket 'avatars' not found. Please create it in your Supabase dashboard under Storage.",
          { duration: 5000 }
        );
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setAvatarLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  const initials = `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>Update your profile information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user.avatar_url} alt={user.username} />
                  <AvatarFallback className="text-xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <input
                    ref={fileInputRef}
                    id="avatar-upload"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={avatarLoading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={avatarLoading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    {avatarLoading ? "Uploading" : "Change Avatar"}
                  </Button>
                  <p className="text-xs text-gray-500 mt-1">
                    JPEG or PNG, max 2MB
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself"
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    maxLength={160}
                    rows={3}
                  />
                  <p className="text-xs text-gray-500">
                    {formData.bio.length}/160
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://example.com"
                    value={formData.website}
                    onChange={(e) =>
                      setFormData({ ...formData, website: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    type="text"
                    placeholder="City, Country"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile_visibility">Profile Visibility</Label>
                  <Select
                    value={formData.profile_visibility}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        profile_visibility: value as
                          | "public"
                          | "private"
                          | "followers_only",
                      })
                    }
                  >
                    <SelectTrigger id="profile_visibility">
                      <span>
                        {formData.profile_visibility === "public"
                          ? "Public"
                          : formData.profile_visibility === "followers_only"
                          ? "Followers Only"
                          : "Private"}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="followers_only">
                        Followers Only
                      </SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
