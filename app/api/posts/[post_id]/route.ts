import { NextRequest } from 'next/server'
import { requireAuth, type AuthenticatedRequest } from '@/lib/middleware/auth'
import { getPostById, updatePost, deletePost } from '@/lib/db/queries'
import { z } from 'zod'

const updatePostSchema = z.object({
  content: z.string().min(1).max(280).optional(),
  image_url: z.string().url().optional().nullable(),
  category: z.enum(['general', 'announcement', 'question']).optional(),
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

    if (req.method === 'GET') {
      const post = await getPostById(postId)
      if (!post) {
        return Response.json(
          { error: 'Post not found' },
          { status: 404 }
        )
      }

      return Response.json(post)
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      const post = await getPostById(postId)
      if (!post) {
        return Response.json(
          { error: 'Post not found' },
          { status: 404 }
        )
      }

      // Check if user is the author
      if (post.author_id !== req.user!.userId && req.user!.role !== 'admin') {
        return Response.json(
          { error: 'Forbidden' },
          { status: 403 }
        )
      }

      const body = await req.json()
      const validated = updatePostSchema.parse(body)

      // Convert null to undefined for image_url
      const updates = {
        ...validated,
        image_url: validated.image_url ?? undefined,
      }

      const updatedPost = await updatePost(postId, updates)
      if (!updatedPost) {
        return Response.json(
          { error: 'Failed to update post' },
          { status: 500 }
        )
      }

      const fullPost = await getPostById(updatedPost.id)
      return Response.json(fullPost)
    }

    if (req.method === 'DELETE') {
      const post = await getPostById(postId)
      if (!post) {
        return Response.json(
          { error: 'Post not found' },
          { status: 404 }
        )
      }

      // Check if user is the author or admin
      if (post.author_id !== req.user!.userId && req.user!.role !== 'admin') {
        return Response.json(
          { error: 'Forbidden' },
          { status: 403 }
        )
      }

      const success = await deletePost(postId)
      if (!success) {
        return Response.json(
          { error: 'Failed to delete post' },
          { status: 500 }
        )
      }

      return Response.json({ message: 'Post deleted successfully' })
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

    console.error('Post error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = requireAuth(handler)
export const PUT = requireAuth(handler)
export const PATCH = requireAuth(handler)
export const DELETE = requireAuth(handler)

