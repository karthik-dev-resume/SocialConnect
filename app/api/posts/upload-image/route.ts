import { NextRequest } from 'next/server'
import { requireAuth, type AuthenticatedRequest } from '@/lib/middleware/auth'
import { createAdminClient } from '@/lib/supabase/admin'

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
    const fileName = `${req.user!.userId}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `posts/${fileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('posts')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: true, // Allow overwriting if file exists
      })

    if (uploadError) {
      console.error('Upload error details:', {
        message: uploadError.message,
        statusCode: uploadError.statusCode,
        error: uploadError.error,
        name: uploadError.name,
      })
      
      // Provide more specific error messages
      let errorMessage = 'Failed to upload file'
      const errorMsgLower = uploadError.message?.toLowerCase() || ''
      
      if (errorMsgLower.includes('bucket not found') || uploadError.statusCode === '404') {
        errorMessage = 'Bucket not found. Please create a storage bucket named "posts" in your Supabase dashboard (Storage section).'
      } else if (uploadError.statusCode === '403' || errorMsgLower.includes('permission')) {
        errorMessage = 'Permission denied. Check storage bucket permissions in Supabase dashboard.'
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
      .from('posts')
      .getPublicUrl(filePath)

    return Response.json({
      image_url: publicUrl,
      message: 'Image uploaded successfully',
    })
  } catch (error) {
    console.error('Image upload error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return Response.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export const POST = requireAuth(handler)

