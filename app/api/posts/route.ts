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

      // Filter posts based on author's profile visibility and active status
      const { checkFollow } = await import('@/lib/db/queries')
      const filteredPosts = await Promise.all(
        posts.map(async (post) => {
          // Filter out posts from inactive users
          if (post.author && (post.author as any).is_active === false) {
            return null // Filter out posts from inactive users
          }
          
          // If post has author info, check visibility
          if (post.author && (post.author as any).profile_visibility) {
            const author = post.author as any
            const profileVisibility = author.profile_visibility
            
            // If author is private and viewer is not the author, check if following
            if (
              profileVisibility === 'private' &&
              req.user!.userId !== author.id
            ) {
              const isFollowing = await checkFollow(req.user!.userId, author.id)
              if (!isFollowing) {
                return null // Filter out this post
              }
            }
            // If author is followers_only and viewer is not the author, check if following
            if (
              profileVisibility === 'followers_only' &&
              req.user!.userId !== author.id
            ) {
              const isFollowing = await checkFollow(req.user!.userId, author.id)
              if (!isFollowing) {
                return null // Filter out this post
              }
            }
          }
          return post
        })
      )

      // Remove null posts (filtered out)
      const visiblePosts = filteredPosts.filter((post) => post !== null) as typeof posts

      // Add like status for current user to each post
      const { checkLike } = await import('@/lib/db/queries')
      const postsWithLikeStatus = await Promise.all(
        visiblePosts.map(async (post) => {
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
        has_more: postsWithLikeStatus.length === limit,
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

