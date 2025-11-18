import { NextRequest } from 'next/server'
import { requireAuth, type AuthenticatedRequest } from '@/lib/middleware/auth'
import { createPost, listPosts, getFeedPosts } from '@/lib/db/queries'
import { z } from 'zod'

const createPostSchema = z.object({
  content: z.string().min(1).max(280, 'Content must be 280 characters or less'),
  image_url: z.string().url().optional().nullable(),
  category: z.enum(['general', 'announcement', 'question']).optional(),
})

async function handler(req: AuthenticatedRequest) {
  try {
    if (req.method === 'GET') {
      const searchParams = req.nextUrl.searchParams
      const limit = parseInt(searchParams.get('limit') || '20')
      const offset = parseInt(searchParams.get('offset') || '0')
      const feed = searchParams.get('feed') === 'true'
      const authorId = searchParams.get('author_id') || undefined

      let posts
      if (feed) {
        posts = await getFeedPosts(req.user!.userId, limit, offset)
      } else {
        posts = await listPosts(limit, offset, authorId)
      }

      // Add like status for current user to each post
      const { checkLike } = await import('@/lib/db/queries')
      const postsWithLikeStatus = await Promise.all(
        posts.map(async (post) => {
          const isLiked = await checkLike(post.id, req.user!.userId)
          return {
            ...post,
            is_liked: isLiked,
          }
        })
      )

      return Response.json({
        results: postsWithLikeStatus,
        count: postsWithLikeStatus.length,
      })
    }

    if (req.method === 'POST') {
      const body = await req.json()
      const validated = createPostSchema.parse(body)

      const post = await createPost({
        content: validated.content,
        author_id: req.user!.userId,
        image_url: validated.image_url || undefined,
        category: validated.category || 'general',
      })

      if (!post) {
        return Response.json(
          { error: 'Failed to create post' },
          { status: 500 }
        )
      }

      // Fetch post with author
      const { getPostById } = await import('@/lib/db/queries')
      const fullPost = await getPostById(post.id)

      return Response.json(fullPost, { status: 201 })
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

    console.error('Posts error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = requireAuth(handler)
export const POST = requireAuth(handler)

