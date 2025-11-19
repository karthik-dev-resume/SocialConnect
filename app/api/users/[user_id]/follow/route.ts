import {
  requireAuth,
  type AuthenticatedRequest,
  type RouteContext,
} from "@/lib/middleware/auth";
import {
  createFollow,
  deleteFollow,
  checkFollow,
  getUserById,
  createNotification,
} from "@/lib/db/queries";

async function handler(req: AuthenticatedRequest, context: RouteContext) {
  try {
    if (!context.params) {
      return Response.json({ error: "User ID is required" }, { status: 400 });
    }
    const resolvedParams =
      context.params instanceof Promise ? await context.params : context.params;
    const followingId = resolvedParams.user_id;

    if (!followingId) {
      return Response.json({ error: "User ID is required" }, { status: 400 });
    }
    const followerId = req.user!.userId;

    // Can't follow yourself
    if (followerId === followingId) {
      return Response.json(
        { error: "Cannot follow yourself" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await getUserById(followingId);
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    if (req.method === "POST") {
      // Check if already following
      const isFollowing = await checkFollow(followerId, followingId);
      if (isFollowing) {
        return Response.json(
          { error: "Already following this user" },
          { status: 400 }
        );
      }

      const follow = await createFollow(followerId, followingId);
      if (!follow) {
        return Response.json(
          { error: "Failed to follow user" },
          { status: 500 }
        );
      }

      // Create notification for the user being followed
      await createNotification({
        user_id: followingId,
        type: "follow",
        actor_id: followerId,
      });

      return Response.json({ message: "Successfully followed user", follow });
    }

    if (req.method === "DELETE") {
      const success = await deleteFollow(followerId, followingId);
      if (!success) {
        return Response.json(
          { error: "Failed to unfollow user" },
          { status: 500 }
        );
      }

      return Response.json({ message: "Successfully unfollowed user" });
    }

    if (req.method === "GET") {
      const isFollowing = await checkFollow(followerId, followingId);
      return Response.json({ isFollowing });
    }

    return Response.json({ error: "Method not allowed" }, { status: 405 });
  } catch (error) {
    console.error("Follow/unfollow error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const GET = requireAuth(handler);
export const POST = requireAuth(handler);
export const DELETE = requireAuth(handler);
