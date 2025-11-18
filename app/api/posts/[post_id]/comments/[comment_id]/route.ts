import { NextRequest } from 'next/server'
import { requireAuth, type AuthenticatedRequest } from '@/lib/middleware/auth'
import { updateComment, deleteComment, getPostById } from '@/lib/db/queries'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const updateCommentSchema = z.object({
  content: z.string().min(1).max(1000),
})

async function handler(
  req: AuthenticatedRequest,
  {
    params,
  }: {
    params:
      | Promise<{ post_id: string; comment_id: string }>
      | { post_id: string; comment_id: string }
  }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const { post_id: postId, comment_id: commentId } = resolvedParams

    if (!postId || !commentId) {
      return Response.json(
        { error: 'Post ID and Comment ID are required' },
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

    // Get comment to check ownership
    const supabase = createAdminClient()
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('*')
      .eq('id', commentId)
      .single()

    if (commentError || !comment) {
      return Response.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      // Check if user is the author or admin
      if (comment.user_id !== req.user!.userId && req.user!.role !== 'admin') {
        return Response.json(
          { error: 'Forbidden' },
          { status: 403 }
        )
      }

      const body = await req.json()
      const validated = updateCommentSchema.parse(body)

      const updatedComment = await updateComment(commentId, validated.content)
      if (!updatedComment) {
        return Response.json(
          { error: 'Failed to update comment' },
          { status: 500 }
        )
      }

      return Response.json(updatedComment)
    }

    if (req.method === 'DELETE') {
      // Check if user is the author or admin
      if (comment.user_id !== req.user!.userId && req.user!.role !== 'admin') {
        return Response.json(
          { error: 'Forbidden' },
          { status: 403 }
        )
      }

      const success = await deleteComment(commentId, postId)
      if (!success) {
        return Response.json(
          { error: 'Failed to delete comment' },
          { status: 500 }
        )
      }

      return Response.json({ message: 'Comment deleted successfully' })
    }

    return Response.json(
      { error: 'Method not allowed' },
      { status: 405 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Comment error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const PUT = requireAuth(handler)
export const PATCH = requireAuth(handler)
export const DELETE = requireAuth(handler)

