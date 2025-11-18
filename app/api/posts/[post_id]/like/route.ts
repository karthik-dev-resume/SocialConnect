import { NextRequest } from 'next/server'
import { requireAuth, type AuthenticatedRequest } from '@/lib/middleware/auth'
import { createLike, deleteLike, checkLike, getPostById } from '@/lib/db/queries'

async function handler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ post_id: string }> | { post_id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const postId = resolvedParams.post_id

    if (!postId) {
      return Response.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    // Check if post exists
    const post = await getPostById(postId)
    if (!post) {
      return Response.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    if (req.method === 'POST') {
      // Toggle like: if already liked, unlike it; if not liked, like it
      const isLiked = await checkLike(postId, req.user!.userId)
      
      if (isLiked) {
        // Unlike the post
        const success = await deleteLike(postId, req.user!.userId)
        if (!success) {
          return Response.json(
            { error: 'Failed to unlike post' },
            { status: 500 }
          )
        }
        const updatedPost = await getPostById(postId)
        return Response.json({
          message: 'Post unliked successfully',
          post: updatedPost,
          liked: false,
        })
      } else {
        // Like the post
        const like = await createLike(postId, req.user!.userId)
        if (!like) {
          return Response.json(
            { error: 'Failed to like post' },
            { status: 500 }
          )
        }
        const updatedPost = await getPostById(postId)
        return Response.json({
          message: 'Post liked successfully',
          post: updatedPost,
          liked: true,
        })
      }
    }

    if (req.method === 'DELETE') {
      const success = await deleteLike(postId, req.user!.userId)
      if (!success) {
        return Response.json(
          { error: 'Failed to unlike post' },
          { status: 500 }
        )
      }

      // Get updated post
      const updatedPost = await getPostById(postId)
      return Response.json({
        message: 'Post unliked successfully',
        post: updatedPost,
      })
    }

    return Response.json(
      { error: 'Method not allowed' },
      { status: 405 }
    )
  } catch (error) {
    console.error('Like/unlike error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const POST = requireAuth(handler)
export const DELETE = requireAuth(handler)

