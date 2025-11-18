"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Image as ImageIcon, X, Loader2 } from "lucide-react";
import { apiRequest, apiRequestFormData } from "@/lib/api/client";
import { toast } from "sonner";

interface CreatePostProps {
  onPostCreated?: () => void;
  onClose?: () => void;
  isModal?: boolean;
}

export function CreatePost({
  onPostCreated,
  onClose,
  isModal = false,
}: CreatePostProps) {
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const data = await apiRequestFormData<{ image_url: string }>(
        "/api/posts/upload-image",
        formData
      );

      if (!data.image_url) {
        throw new Error("No image URL returned from server");
      }

      console.log("Image URL received:", data.image_url);
      setImageUrl(data.image_url);
      toast.success("Image uploaded successfully");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to upload image";

      // Provide helpful message for bucket not found error
      if (errorMessage.toLowerCase().includes("bucket not found")) {
        toast.error(
          "Storage bucket 'posts' not found. Please create it in your Supabase dashboard under Storage.",
          { duration: 5000 }
        );
      } else {
        toast.error(errorMessage);
      }
      setImageUrl(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error("Post content cannot be empty");
      return;
    }

    if (content.length > 280) {
      toast.error("Post content must be 280 characters or less");
      return;
    }

    setLoading(true);

    try {
      await apiRequest("/api/posts", {
        method: "POST",
        body: JSON.stringify({
          content: content.trim(),
          image_url: imageUrl,
        }),
      });

      setContent("");
      setImageUrl(null);
      toast.success("Post created successfully!");
      onPostCreated?.();
      onClose?.();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create post";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <Textarea
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={280}
          rows={6}
          className="resize-none text-base min-h-[120px] border-2 transition-colors"
        />
        {uploadingImage && (
          <div className="relative w-full rounded-lg overflow-hidden border-2 border-border bg-muted flex items-center justify-center min-h-[200px]">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Uploading image...
              </p>
            </div>
          </div>
        )}
        {imageUrl && !uploadingImage && (
          <div className="relative w-full rounded-lg overflow-hidden border-2 border-border bg-muted">
            <div className="relative w-full aspect-video max-h-[300px]">
              <Image
                src={imageUrl}
                alt="Preview"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 600px"
                unoptimized
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setImageUrl(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-colors z-10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <div
          className="flex items-center gap-3"
          onClick={() => {
            if (fileInputRef.current) {
              fileInputRef.current.click();
            }
          }}
        >
          <label htmlFor="image-upload" className="cursor-pointer">
            <input
              ref={fileInputRef}
              id="image-upload"
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleImageSelect}
              className="hidden"
              disabled={loading || uploadingImage}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading || uploadingImage}
              className="gap-2"
            >
              {uploadingImage ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <ImageIcon className="h-4 w-4" />
                  {imageUrl ? "Change Image" : "Add Image"}
                </>
              )}
            </Button>
          </label>
          <span className="text-sm text-muted-foreground">
            {content.length}/280
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isModal && onClose && (
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={loading || !content.trim()}
            className="min-w-[100px]"
          >
            {loading ? "Posting..." : "Post"}
          </Button>
        </div>
      </div>
    </form>
  );
}
