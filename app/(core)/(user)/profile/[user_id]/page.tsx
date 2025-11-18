"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { Navbar } from "@/components/navbar";
import { PostCard } from "@/components/post-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/api/client";
import { toast } from "sonner";
import type { User, Post, UserStats } from "@/lib/db/types";
import { UserPlus, UserMinus } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

type UserWithStats = User & UserStats;

export default function ProfilePage() {
  const params = useParams();
  const userId = params.user_id as string;
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<UserWithStats | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const [userData, postsData] = await Promise.all([
        apiRequest<UserWithStats>(`/api/users/${userId}`),
        apiRequest<{ results: Post[] }>(`/api/posts?author_id=${userId}`),
      ]);

      setUser(userData);
      setPosts(postsData.results);

      // Check if current user follows this user
      if (currentUser && currentUser.id !== userId) {
        try {
          const followStatus = await apiRequest<{ isFollowing: boolean }>(
            `/api/users/${userId}/follow`
          );
          setIsFollowing(followStatus.isFollowing);
        } catch (error) {
          // Silently fail - assume not following
          setIsFollowing(false);
        }
      } else {
        setIsFollowing(false);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load profile";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser || followLoading) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await apiRequest(`/api/users/${userId}/follow`, { method: "DELETE" });
        setIsFollowing(false);
        // Update followers count optimistically
        setUser((prev) =>
          prev
            ? {
                ...prev,
                followers_count: Math.max(0, (prev.followers_count || 0) - 1),
              }
            : null
        );
        toast.success("Unfollowed user");
        // Refresh posts (they may be hidden now)
        try {
          const postsData = await apiRequest<{ results: Post[] }>(
            `/api/posts?author_id=${userId}`
          );
          setPosts(postsData.results);
        } catch {
          // Silently fail - posts will be empty
          setPosts([]);
        }
      } else {
        await apiRequest(`/api/users/${userId}/follow`, { method: "POST" });
        setIsFollowing(true);
        // Update followers count optimistically
        setUser((prev) =>
          prev
            ? { ...prev, followers_count: (prev.followers_count || 0) + 1 }
            : null
        );
        toast.success("Following user");
        // Refresh posts (they may now be visible)
        try {
          const postsData = await apiRequest<{ results: Post[] }>(
            `/api/posts?author_id=${userId}`
          );
          setPosts(postsData.results);
        } catch {
          // Silently fail
        }
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to follow/unfollow user";
      toast.error(errorMessage);
      // Revert optimistic update on error
      if (isFollowing) {
        setUser((prev) =>
          prev
            ? { ...prev, followers_count: (prev.followers_count || 0) + 1 }
            : null
        );
      } else {
        setUser((prev) =>
          prev
            ? {
                ...prev,
                followers_count: Math.max(0, (prev.followers_count || 0) - 1),
              }
            : null
        );
      }
    } finally {
      setFollowLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId, currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-8">
            <p className="text-gray-500">User not found</p>
          </div>
        </div>
      </div>
    );
  }

  const initials = `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
  const isOwnProfile = currentUser?.id === userId;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                <AvatarImage src={user.avatar_url} alt={user.username} />
                <AvatarFallback className="text-xl sm:text-2xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 w-full">
                <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between mb-3 sm:mb-4 space-y-3 sm:space-y-0">
                  <div className="text-center sm:text-left">
                    <h1 className="text-xl sm:text-2xl font-bold">
                      {user.first_name} {user.last_name}
                    </h1>
                    <p className="text-sm sm:text-base text-gray-500">
                      @{user.username}
                    </p>
                  </div>
                  {!isOwnProfile && currentUser && (
                    <Button
                      onClick={handleFollow}
                      variant={isFollowing ? "outline" : "default"}
                      disabled={followLoading}
                      className="w-full sm:w-auto text-sm sm:text-base"
                    >
                      {followLoading ? (
                        "Loading..."
                      ) : isFollowing ? (
                        <>
                          <UserMinus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                          Unfollow
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                          Follow
                        </>
                      )}
                    </Button>
                  )}
                  {isOwnProfile && (
                    <Button
                      variant="outline"
                      asChild
                      className="w-full sm:w-auto text-sm sm:text-base"
                    >
                      <a href="/settings">Edit Profile</a>
                    </Button>
                  )}
                </div>
                {user.bio && (
                  <p className="mb-3 sm:mb-4 text-sm sm:text-base text-center sm:text-left">
                    {user.bio}
                  </p>
                )}
                <div className="flex justify-center sm:justify-start space-x-4 sm:space-x-6 text-xs sm:text-sm">
                  <div>
                    <span className="font-semibold">
                      {user.posts_count || 0}
                    </span>
                    <span className="text-gray-500 ml-1">Posts</span>
                  </div>
                  <div>
                    <span className="font-semibold">
                      {user.followers_count || 0}
                    </span>
                    <span className="text-gray-500 ml-1">Followers</span>
                  </div>
                  <div>
                    <span className="font-semibold">
                      {user.following_count || 0}
                    </span>
                    <span className="text-gray-500 ml-1">Following</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-xl font-bold mb-4">Posts</h2>
          {posts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                {user.profile_visibility === "private" &&
                !isOwnProfile &&
                !isFollowing ? (
                  <div className="space-y-2">
                    <p className="font-semibold">This account is private</p>
                    <p className="text-sm">
                      Follow this account to see their posts
                    </p>
                  </div>
                ) : user.profile_visibility === "followers_only" &&
                  !isOwnProfile &&
                  !isFollowing ? (
                  <div className="space-y-2">
                    <p className="font-semibold">
                      This account&apos;s posts are only visible to followers
                    </p>
                    <p className="text-sm">
                      Follow this account to see their posts
                    </p>
                  </div>
                ) : (
                  "No posts yet"
                )}
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </div>
      </div>
    </div>
  );
}
