'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { Navbar } from '@/components/navbar'
import { PostCard } from '@/components/post-card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { apiRequest } from '@/lib/api/client'
import { toast } from 'sonner'
import type { User, Post, UserStats } from '@/lib/db/types'
import { UserPlus, UserMinus } from 'lucide-react'

type UserWithStats = User & UserStats

export default function ProfilePage() {
  const params = useParams()
  const userId = params.user_id as string
  const { user: currentUser } = useAuth()
  const [user, setUser] = useState<UserWithStats | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const [userData, postsData] = await Promise.all([
        apiRequest<UserWithStats>(
          `/api/users/${userId}`
        ),
        apiRequest<{ results: Post[] }>(`/api/posts?author_id=${userId}`),
      ])

      setUser(userData)
      setPosts(postsData.results)

      // Check if current user follows this user
      if (currentUser && currentUser.id !== userId) {
        try {
          // We'll check this by trying to get followers list or use a separate endpoint
          // For now, we'll assume not following and let the follow button handle it
        } catch (error) {
          // Ignore
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load profile';
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async () => {
    if (!currentUser) return

    try {
      if (isFollowing) {
        await apiRequest(`/api/users/${userId}/follow`, { method: 'DELETE' })
        setIsFollowing(false)
        toast.success('Unfollowed user')
      } else {
        await apiRequest(`/api/users/${userId}/follow`, { method: 'POST' })
        setIsFollowing(true)
        toast.success('Following user')
      }
      fetchProfile()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to follow/unfollow user';
      toast.error(errorMessage)
    }
  }

  useEffect(() => {
    if (userId) {
      fetchProfile()
    }
  }, [userId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-8">
            <p className="text-gray-500">Loading profile...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-8">
            <p className="text-gray-500">User not found</p>
          </div>
        </div>
      </div>
    )
  }

  const initials = `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
  const isOwnProfile = currentUser?.id === userId

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.avatar_url} alt={user.username} />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold">
                      {user.first_name} {user.last_name}
                    </h1>
                    <p className="text-gray-500">@{user.username}</p>
                  </div>
                  {!isOwnProfile && currentUser && (
                    <Button onClick={handleFollow} variant={isFollowing ? 'outline' : 'default'}>
                      {isFollowing ? (
                        <>
                          <UserMinus className="mr-2 h-4 w-4" />
                          Unfollow
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Follow
                        </>
                      )}
                    </Button>
                  )}
                  {isOwnProfile && (
                    <Button variant="outline" asChild>
                      <a href="/settings">Edit Profile</a>
                    </Button>
                  )}
                </div>
                {user.bio && <p className="mb-4">{user.bio}</p>}
                <div className="flex space-x-6 text-sm">
                  <div>
                    <span className="font-semibold">{user.posts_count || 0}</span>
                    <span className="text-gray-500 ml-1">Posts</span>
                  </div>
                  <div>
                    <span className="font-semibold">{user.followers_count || 0}</span>
                    <span className="text-gray-500 ml-1">Followers</span>
                  </div>
                  <div>
                    <span className="font-semibold">{user.following_count || 0}</span>
                    <span className="text-gray-500 ml-1">Following</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-xl font-bold mb-4">Posts</h2>
          {posts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                No posts yet
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </div>
      </div>
    </div>
  )
}

