"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/use-auth";
import { Navbar } from "@/components/navbar";
import { CreatePost } from "@/components/create-post";
import { PostCard } from "@/components/post-card";
import { apiRequest } from "@/lib/api/client";
import type { Post } from "@/lib/db/types";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function FeedPage() {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      // Fetch all posts (not just followed users)
      const data = await apiRequest<{ results: Post[] }>("/api/posts");
      setPosts(data.results);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to load posts";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchPosts();
    }
  }, [authLoading, user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Create Post Button */}
        <CreatePost
          onPostCreated={() => {
            fetchPosts();
          }}
        />

        {/* Posts Feed */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Spinner size="lg" />
            <p className="mt-4 text-muted-foreground">Loading posts</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">
                No posts yet
              </h3>
              <p className="text-muted-foreground">
                Be the first to share something with the community!
              </p>
              <Button
                onClick={() => {
                  // Scroll to top and focus on create post
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Post
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
