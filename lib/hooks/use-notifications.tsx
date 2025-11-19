"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { apiRequest } from "@/lib/api/client";
import type { Notification } from "@/lib/db/types";
import { useAuth } from "./use-auth";

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: Error | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const data = await apiRequest<{
        notifications: Notification[];
        unread_count: number;
      }>("/api/notifications?limit=50");

      setNotifications(data.notifications);
      setUnreadCount(data.unread_count);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch notifications"));
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    fetchNotifications();

    // Set up Supabase Realtime subscription
    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // New notification received - refresh the notifications list to get full data
          fetchNotifications();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Notification updated (e.g., marked as read)
          const updatedNotification = payload.new as Notification;
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === updatedNotification.id ? updatedNotification : n
            )
          );
          
          // Update unread count if notification was marked as read
          if (updatedNotification.is_read) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("Subscribed to notifications channel");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await apiRequest(`/api/notifications/${notificationId}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "mark_read" }),
      });

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification as read:", err);
      throw err;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await apiRequest("/api/notifications", {
        method: "POST",
        body: JSON.stringify({ action: "mark_all_read" }),
      });

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
      throw err;
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refreshNotifications: fetchNotifications,
  };
}

