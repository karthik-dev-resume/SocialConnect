import { NextRequest } from 'next/server'
import { requireAuth, type AuthenticatedRequest } from '@/lib/middleware/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { updateUser } from '@/lib/db/queries'

async function handler(req: AuthenticatedRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return Response.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!validTypes.includes(file.type)) {
      return Response.json(
        { error: 'Invalid file type. Only JPEG and PNG are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      return Response.json(
        { error: 'File size exceeds 2MB limit' },
        { status: 400 }
      )
    }

    // Upload to Supabase Storage
    const supabase = createAdminClient()
    const fileExt = file.name.split('.').pop()
    const fileName = `${req.user!.userId}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: true, // Allow overwriting if file exists
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      
      // Provide more specific error messages
      let errorMessage = 'Failed to upload file'
      if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('bucket')) {
        errorMessage = 'Storage bucket "avatars" not found. Please create it in your Supabase dashboard under Storage.'
      } else if (uploadError.message) {
        errorMessage = uploadError.message
      }
      
      return Response.json(
        { error: errorMessage },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    // Update user avatar_url
    await updateUser(req.user!.userId, { avatar_url: publicUrl })

    return Response.json({
      avatar_url: publicUrl,
      message: 'Avatar uploaded successfully',
    })
  } catch (error) {
    console.error('Avatar upload error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const POST = requireAuth(handler)

