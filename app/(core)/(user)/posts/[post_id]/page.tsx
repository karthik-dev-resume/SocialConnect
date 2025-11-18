'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { Navbar } from '@/components/navbar'
import { PostCard } from '@/components/post-card'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { apiRequest } from '@/lib/api/client'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import type { Post, Comment } from '@/lib/db/types'

export default function PostDetailPage() {
  const params = useParams()
  const postId = params.post_id as string
  const { user } = useAuth()
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentContent, setCommentContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const fetchPost = async () => {
    try {
      setLoading(true)
      const [postData, commentsData] = await Promise.all([
        apiRequest<Post>(`/api/posts/${postId}`),
        apiRequest<{ results: Comment[] }>(`/api/posts/${postId}/comments`),
      ])

      setPost(postData)
      setComments(commentsData.results)
    } catch (error: any) {
      toast.error(error.message || 'Failed to load post')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!commentContent.trim()) {
      toast.error('Comment cannot be empty')
      return
    }

    setSubmitting(true)

    try {
      await apiRequest(`/api/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: commentContent }),
      })

      setCommentContent('')
      toast.success('Comment added!')
      fetchPost()
    } catch (error: any) {
      toast.error(error.message || 'Failed to add comment')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (postId) {
      fetchPost()
    }
  }, [postId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="text-center py-8">
            <p className="text-gray-500">Loading post...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="text-center py-8">
            <p className="text-gray-500">Post not found</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <PostCard post={post} onUpdate={fetchPost} />

        <Card className="mt-4">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4">Comments ({comments.length})</h3>

            {user && (
              <form onSubmit={handleSubmitComment} className="mb-6">
                <div className="flex space-x-2">
                  <Textarea
                    placeholder="Write a comment..."
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    rows={2}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={submitting || !commentContent.trim()}>
                    {submitting ? 'Posting...' : 'Post'}
                  </Button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No comments yet</p>
              ) : (
                comments.map((comment) => {
                  const commentUser = (comment as any).user || comment
                  const initials = commentUser.first_name
                    ? `${commentUser.first_name[0]}${commentUser.last_name[0]}`.toUpperCase()
                    : 'U'

                  return (
                    <div key={comment.id} className="flex space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={commentUser.avatar_url} />
                        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="bg-gray-100 rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-semibold text-sm">
                              {commentUser.first_name} {commentUser.last_name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

