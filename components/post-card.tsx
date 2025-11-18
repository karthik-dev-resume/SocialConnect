"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreVertical,
  Edit,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/api/client";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import type { Post } from "@/lib/db/types";
import { useAuth } from "@/lib/hooks/use-auth";
import { Textarea } from "@/components/ui/textarea";

interface PostCardProps {
  post: Post & {
    is_liked?: boolean;
    author?: {
      id: string;
      first_name: string;
      last_name: string;
      username: string;
      avatar_url?: string;
    };
  };
  onUpdate?: () => void;
}

export function PostCard({ post, onUpdate }: PostCardProps) {
  // Initialize isLiked from post.is_liked if available
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Check if we're on the post details page
  const isPostDetailsPage = pathname?.startsWith(`/posts/${post.id}`);

  // Update isLiked when post prop changes
  useEffect(() => {
    setIsLiked(post.is_liked || false);
    setLikeCount(post.like_count);
    setEditContent(post.content);
  }, [post]);

  const author = post.author;
  const authorName = author
    ? `${author.first_name} ${author.last_name}`
    : "Unknown";
  const authorUsername = author?.username || "unknown";
  const initials = author
    ? `${author.first_name[0]}${author.last_name[0]}`.toUpperCase()
    : "U";

  const handleLike = async () => {
    if (loading || !user) return;

    // Optimistic update - update UI immediately
    const previousLiked = isLiked;
    const previousCount = likeCount;
    setIsLiked(!previousLiked);
    setLikeCount(
      previousLiked ? Math.max(0, previousCount - 1) : previousCount + 1
    );
    setLoading(true);

    try {
      // POST toggles like/unlike
      const response = await apiRequest<{ liked: boolean; post: Post }>(
        `/api/posts/${post.id}/like`,
        { method: "POST" }
      );

      // Update state based on response (in case server state differs)
      setIsLiked(response.liked);
      if (response.post) {
        setLikeCount(response.post.like_count);
      } else {
        // Fallback: update count based on like status
        setLikeCount((prev) =>
          response.liked ? prev + 1 : Math.max(0, prev - 1)
        );
      }

      // Only call onUpdate if it's needed for other updates (not for likes)
      // onUpdate?.()
    } catch (error: unknown) {
      // Revert optimistic update on error
      setIsLiked(previousLiked);
      setLikeCount(previousCount);
      const message =
        error instanceof Error ? error.message : "Failed to like post";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const postUrl = `${window.location.origin}/posts/${post.id}`;
    const shareText = post.content
      ? `${post.content.substring(0, 100)}${
          post.content.length > 100 ? "..." : ""
        }`
      : "Check out this post";

    try {
      // Use Web Share API if available (mobile-friendly)
      if (navigator.share) {
        await navigator.share({
          title: `Post by ${authorName}`,
          text: shareText,
          url: postUrl,
        });
        toast.success("Shared successfully!");
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(postUrl);
        toast.success("Link copied to clipboard!");
      }
    } catch (error: unknown) {
      // User cancelled share or error occurred
      if (error instanceof Error && error.name !== "AbortError") {
        // Try clipboard as fallback if share failed
        try {
          await navigator.clipboard.writeText(postUrl);
          toast.success("Link copied to clipboard!");
        } catch {
          toast.error("Failed to share post");
        }
      }
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (deleting || !user) return;

    setDeleting(true);
    try {
      await apiRequest(`/api/posts/${post.id}`, { method: "DELETE" });
      toast.success("Post deleted successfully");
      setShowDeleteModal(false);

      // If on post details page, redirect to feed
      if (isPostDetailsPage) {
        router.push("/feed");
      } else {
        // Otherwise, just refresh the list
        onUpdate?.();
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to delete post";
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditContent(post.content);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(post.content);
  };

  const handleSaveEdit = async () => {
    if (saving || !user) return;

    if (!editContent.trim()) {
      toast.error("Post content cannot be empty");
      return;
    }

    if (editContent.length > 280) {
      toast.error("Post content must be 280 characters or less");
      return;
    }

    setSaving(true);
    try {
      await apiRequest<Post>(`/api/posts/${post.id}`, {
        method: "PUT",
        body: JSON.stringify({ content: editContent.trim() }),
      });

      toast.success("Post updated successfully");
      setIsEditing(false);
      onUpdate?.();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to update post";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className=" bg-white transition-all duration-200 hover:shadow-lg border-2 hover:border-primary/20 gap-4 lg:gap-4 p-4 lg:p-6">
      <CardHeader className="p-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href={`/profile/${author?.id || post.author_id}`}
              className="hover:opacity-80 transition-opacity"
            >
              <Avatar className="ring-2 ring-offset-2 ring-primary/20 hover:ring-primary/40 transition-all">
                <AvatarImage src={author?.avatar_url} alt={authorName} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <Link
                href={`/profile/${author?.id || post.author_id}`}
                className="hover:underline"
              >
                <p className="text-sm lg:text-base font-semibold text-foreground">
                  {authorName}
                </p>
              </Link>
              <p className="text-xs lg:text-sm text-muted-foreground">
                @{authorUsername}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), {
                addSuffix: true,
              })}
            </span>
            {user?.id === post.author_id && isPostDetailsPage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={deleting}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={handleEdit}
                    disabled={isEditing || deleting}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDeleteClick}
                    variant="destructive"
                    disabled={deleting || isEditing}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-0">
        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="text-xs lg:text-base min-h-[100px]"
              disabled={saving}
              maxLength={280}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {editContent.length}/280
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={saving || !editContent.trim()}
                >
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs lg:text-base  text-foreground whitespace-pre-wrap leading-relaxed">
            {post.content}
          </p>
        )}
        {post.image_url && !isEditing && (
          <div className="rounded-xl overflow-hidden border-2 border-border shadow-sm w-full">
            <Image
              src={post.image_url}
              alt="Post image"
              width={1200}
              height={800}
              className="w-full h-auto object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              unoptimized
            />
          </div>
        )}
        {!isEditing && (
          <div className="flex items-center space-x-1 pt-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={loading || !user}
              className={`gap-2 ${
                isLiked
                  ? "text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                  : "hover:bg-accent"
              }`}
            >
              <Heart
                className={`h-5 w-5 transition-all ${
                  isLiked ? "fill-current text-red-500 scale-110" : ""
                }`}
              />
              <span className="font-medium">{likeCount}</span>
            </Button>
            <Link href={`/posts/${post.id}`}>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 hover:bg-accent"
              >
                <MessageCircle className="h-5 w-5" />
                <span className="font-medium">{post.comment_count}</span>
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 hover:bg-accent"
              onClick={handleShare}
            >
              <Share2 className="h-5 w-5" />
              <span className="font-medium">Share</span>
            </Button>
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this post? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
