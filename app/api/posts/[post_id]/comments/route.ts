import { NextRequest } from 'next/server'
import { requireAuth, type AuthenticatedRequest } from '@/lib/middleware/auth'
import { createComment, getPostComments, getPostById } from '@/lib/db/queries'
import { z } from 'zod'

const createCommentSchema = z.object({
  content: z.string().min(1).max(1000),
})

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

    if (req.method === 'GET') {
      const searchParams = req.nextUrl.searchParams
      const limit = parseInt(searchParams.get('limit') || '50')
      const offset = parseInt(searchParams.get('offset') || '0')

      const comments = await getPostComments(postId, limit, offset)
      return Response.json({
        results: comments,
        count: comments.length,
      })
    }

    if (req.method === 'POST') {
      const body = await req.json()
      const validated = createCommentSchema.parse(body)

      const comment = await createComment({
        post_id: postId,
        user_id: req.user!.userId,
        content: validated.content,
      })

      if (!comment) {
        return Response.json(
          { error: 'Failed to create comment' },
          { status: 500 }
        )
      }

      // Fetch comment with user
      const comments = await getPostComments(postId, 1, 0)
      const newComment = comments.find(c => c.id === comment.id)

      return Response.json(newComment || comment, { status: 201 })
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

    console.error('Comments error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = requireAuth(handler)
export const POST = requireAuth(handler)

