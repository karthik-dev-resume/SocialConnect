'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { apiRequest, apiRequestFormData } from '@/lib/api/client'
import { toast } from 'sonner'
import { Camera } from 'lucide-react'

export default function SettingsPage() {
  const { user, refreshUser } = useAuth()
  const [formData, setFormData] = useState({
    bio: '',
    website: '',
    location: '',
    profile_visibility: 'public' as 'public' | 'private' | 'followers_only',
  })
  const [loading, setLoading] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData({
        bio: user.bio || '',
        website: user.website || '',
        location: user.location || '',
        profile_visibility: user.profile_visibility || 'public',
      })
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await apiRequest('/api/users/me', {
        method: 'PATCH',
        body: JSON.stringify(formData),
      })
      toast.success('Profile updated successfully!')
      refreshUser()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setAvatarLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      await apiRequestFormData('/api/users/upload-avatar', formData)
      toast.success('Avatar updated successfully!')
      refreshUser()
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload avatar')
    } finally {
      setAvatarLoading(false)
    }
  }

  if (!user) {
    return null
  }

  const initials = `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>Update your profile information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user.avatar_url} alt={user.username} />
                  <AvatarFallback className="text-xl">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <label htmlFor="avatar-upload" className="cursor-pointer">
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={avatarLoading}
                    />
                    <Button type="button" variant="outline" disabled={avatarLoading}>
                      <Camera className="mr-2 h-4 w-4" />
                      {avatarLoading ? 'Uploading...' : 'Change Avatar'}
                    </Button>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">JPEG or PNG, max 2MB</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    maxLength={160}
                    rows={3}
                  />
                  <p className="text-xs text-gray-500">{formData.bio.length}/160</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://example.com"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    type="text"
                    placeholder="City, Country"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile_visibility">Profile Visibility</Label>
                  <select
                    id="profile_visibility"
                    value={formData.profile_visibility}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        profile_visibility: e.target.value as 'public' | 'private' | 'followers_only',
                      })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="public">Public</option>
                    <option value="followers_only">Followers Only</option>
                    <option value="private">Private</option>
                  </select>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

