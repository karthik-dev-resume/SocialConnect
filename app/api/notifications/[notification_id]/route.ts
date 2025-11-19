import { requireAuth, type AuthenticatedRequest } from "@/lib/middleware/auth";
import { markNotificationAsRead } from "@/lib/db/queries";

async function handler(
  req: AuthenticatedRequest,
  { params }: { params: { notification_id: string } }
) {
  try {
    if (req.method === "PATCH" || req.method === "PUT") {
      const body = await req.json();
      if (body.action === "mark_read") {
        const success = await markNotificationAsRead(params.notification_id);
        if (!success) {
          return Response.json(
            { error: "Failed to mark notification as read" },
            { status: 500 }
          );
        }
        return Response.json({ success: true });
      }
    }

    return Response.json({ error: "Method not allowed" }, { status: 405 });
  } catch (error) {
    console.error("Notification error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const PATCH = requireAuth(handler);
export const PUT = requireAuth(handler);

