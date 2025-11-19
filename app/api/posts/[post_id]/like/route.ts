import {
  requireAuth,
  type AuthenticatedRequest,
  type RouteContext,
} from "@/lib/middleware/auth";
import {
  createLike,
  deleteLike,
  checkLike,
  getPostById,
  createNotification,
} from "@/lib/db/queries";

async function handler(req: AuthenticatedRequest, context: RouteContext) {
  try {
    if (!context.params) {
      return Response.json({ error: "Post ID is required" }, { status: 400 });
    }

    const resolvedParams =
      context.params instanceof Promise ? await context.params : context.params;
    const postId = resolvedParams.post_id;

    if (!postId) {
      return Response.json({ error: "Post ID is required" }, { status: 400 });
    }

    // Check if post exists
    const post = await getPostById(postId);
    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    if (req.method === "POST") {
      // Toggle like: if already liked, unlike it; if not liked, like it
      const isLiked = await checkLike(postId, req.user!.userId);

      if (isLiked) {
        // Unlike the post
        const success = await deleteLike(postId, req.user!.userId);
        if (!success) {
          return Response.json(
            { error: "Failed to unlike post" },
            { status: 500 }
          );
        }
        const updatedPost = await getPostById(postId);
        return Response.json({
          message: "Post unliked successfully",
          post: updatedPost,
          liked: false,
        });
      } else {
        // Like the post
        const like = await createLike(postId, req.user!.userId);
        if (!like) {
          return Response.json(
            { error: "Failed to like post" },
            { status: 500 }
          );
        }
        
        // Create notification for the post author (if not the same user)
        if (post.author_id !== req.user!.userId) {
          await createNotification({
            user_id: post.author_id,
            type: "like",
            actor_id: req.user!.userId,
            post_id: postId,
          });
        }
        
        const updatedPost = await getPostById(postId);
        return Response.json({
          message: "Post liked successfully",
          post: updatedPost,
          liked: true,
        });
      }
    }

    if (req.method === "DELETE") {
      const success = await deleteLike(postId, req.user!.userId);
      if (!success) {
        return Response.json(
          { error: "Failed to unlike post" },
          { status: 500 }
        );
      }

      // Get updated post
      const updatedPost = await getPostById(postId);
      return Response.json({
        message: "Post unliked successfully",
        post: updatedPost,
      });
    }

    return Response.json({ error: "Method not allowed" }, { status: 405 });
  } catch (error) {
    console.error("Like/unlike error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const POST = requireAuth(handler);
export const DELETE = requireAuth(handler);
