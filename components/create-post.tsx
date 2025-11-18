'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Image as ImageIcon, X } from 'lucide-react'
import { apiRequest, apiRequestFormData } from '@/lib/api/client'
import { toast } from 'sonner'
import { useAuth } from '@/lib/hooks/use-auth'

interface CreatePostProps {
  onPostCreated?: () => void
}

export function CreatePost({ onPostCreated }: CreatePostProps) {
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      toast.error('Only JPEG and PNG images are allowed')
      return
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB')
      return
    }

    setImageFile(file)
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const data = await apiRequestFormData<{ image_url: string }>(
        '/api/posts/upload-image',
        formData
      )

      setImageUrl(data.image_url)
      toast.success('Image uploaded successfully')
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
      toast.error(errorMessage)
      setImageFile(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      toast.error('Post content cannot be empty')
      return
    }

    if (content.length > 280) {
      toast.error('Post content must be 280 characters or less')
      return
    }

    setLoading(true)

    try {
      await apiRequest('/api/posts', {
        method: 'POST',
        body: JSON.stringify({
          content: content.trim(),
          image_url: imageUrl,
        }),
      })

      setContent('')
      setImageUrl(null)
      setImageFile(null)
      toast.success('Post created successfully!')
      onPostCreated?.()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create post';
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={280}
            rows={4}
            className="resize-none"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <label htmlFor="image-upload" className="cursor-pointer">
                <input
                  id="image-upload"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleImageSelect}
                  className="hidden"
                  disabled={loading}
                />
                <Button type="button" variant="outline" size="sm" disabled={loading}>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Add Image
                </Button>
              </label>
              {imageUrl && (
                <div className="relative inline-block">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="h-16 w-16 object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImageUrl(null)
                      setImageFile(null)
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {content.length}/280
              </span>
              <Button type="submit" disabled={loading || !content.trim()}>
                {loading ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

