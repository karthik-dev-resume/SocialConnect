import { requireAuth, type AuthenticatedRequest } from "@/lib/middleware/auth";
import {
  getUserNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
} from "@/lib/db/queries";

async function handler(req: AuthenticatedRequest) {
  try {
    if (req.method === "GET") {
      const searchParams = req.nextUrl.searchParams;
      const limit = parseInt(searchParams.get("limit") || "50");
      const offset = parseInt(searchParams.get("offset") || "0");
      const unreadOnly = searchParams.get("unread_only") === "true";

      const notifications = await getUserNotifications(
        req.user!.userId,
        limit,
        offset
      );

      const filteredNotifications = unreadOnly
        ? notifications.filter((n) => !n.is_read)
        : notifications;

      const unreadCount = await getUnreadNotificationCount(req.user!.userId);

      return Response.json({
        notifications: filteredNotifications,
        unread_count: unreadCount,
        count: filteredNotifications.length,
      });
    }

    if (req.method === "POST") {
      const body = await req.json();
      if (body.action === "mark_all_read") {
        const success = await markAllNotificationsAsRead(req.user!.userId);
        if (!success) {
          return Response.json(
            { error: "Failed to mark notifications as read" },
            { status: 500 }
          );
        }
        return Response.json({ success: true });
      }
    }

    return Response.json({ error: "Method not allowed" }, { status: 405 });
  } catch (error) {
    console.error("Notifications error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const GET = requireAuth(handler);
export const POST = requireAuth(handler);

