"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/use-auth";
import { Navbar } from "@/components/navbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api/client";
import { toast } from "sonner";
import { Users, FileText, Activity, Trash2, Shield } from "lucide-react";
import type { User, Post } from "@/lib/db/types";

interface Stats {
  total_users: number;
  total_posts: number;
  active_today: number;
}

export default function AdminPage() {
  const { user: currentUser } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"stats" | "users" | "posts">(
    "stats"
  );

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchPosts();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await apiRequest<Stats>("/api/admin/stats");
      setStats(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await apiRequest<{ results: User[] }>("/api/admin/users");
      setUsers(data.results);
    } catch (error: any) {
      toast.error(error.message || "Failed to load users");
    }
  };

  const fetchPosts = async () => {
    try {
      const data = await apiRequest<{ results: Post[] }>("/api/admin/posts");
      setPosts(data.results);
    } catch (error: any) {
      toast.error(error.message || "Failed to load posts");
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    if (!confirm("Are you sure you want to deactivate this user?")) return;

    try {
      await apiRequest(`/api/admin/users/${userId}/deactivate`, {
        method: "POST",
      });
      toast.success("User deactivated successfully");
      fetchUsers();
      fetchStats();
    } catch (error: any) {
      toast.error(error.message || "Failed to deactivate user");
    }
  };

  const handlePromoteToAdmin = async (userId: string) => {
    if (!confirm("Are you sure you want to promote this user to admin?"))
      return;

    try {
      await apiRequest(`/api/admin/users/${userId}/promote`, {
        method: "POST",
      });
      toast.success("User promoted to admin successfully");
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to promote user");
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      await apiRequest(`/api/admin/posts/${postId}`, { method: "DELETE" });
      toast.success("Post deleted successfully");
      fetchPosts();
      fetchStats();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete post");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

        <div className="flex space-x-2 mb-6">
          <Button
            variant={activeTab === "stats" ? "default" : "outline"}
            onClick={() => setActiveTab("stats")}
          >
            <Activity className="mr-2 h-4 w-4" />
            Statistics
          </Button>
          <Button
            variant={activeTab === "users" ? "default" : "outline"}
            onClick={() => setActiveTab("users")}
          >
            <Users className="mr-2 h-4 w-4" />
            Users
          </Button>
          <Button
            variant={activeTab === "posts" ? "default" : "outline"}
            onClick={() => setActiveTab("posts")}
          >
            <FileText className="mr-2 h-4 w-4" />
            Posts
          </Button>
        </div>

        {activeTab === "stats" && stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.total_users}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Posts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.total_posts}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Active Today</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.active_today}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "users" && (
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>Manage users and their accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-semibold">
                        {user.first_name} {user.last_name}
                        {user.role === "admin" && (
                          <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                            Admin
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">
                        @{user.username} • {user.email}
                      </p>
                      <p className="text-xs text-gray-400">
                        Role: {user.role} • Status:{" "}
                        {user.is_active ? "Active" : "Inactive"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {user.is_active && user.id !== currentUser?.id && (
                        <>
                          {user.role !== "admin" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePromoteToAdmin(user.id)}
                            >
                              <Shield className="h-4 w-4 mr-1" />
                              Promote
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeactivateUser(user.id)}
                          >
                            Deactivate
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "posts" && (
          <Card>
            <CardHeader>
              <CardTitle>All Posts</CardTitle>
              <CardDescription>Manage posts and content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {posts.map((post) => (
                  <div key={post.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold mb-2">{post.content}</p>
                        <p className="text-sm text-gray-500">
                          Author ID: {post.author_id} • Created:{" "}
                          {new Date(post.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-400">
                          Likes: {post.like_count} • Comments:{" "}
                          {post.comment_count}
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeletePost(post.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
