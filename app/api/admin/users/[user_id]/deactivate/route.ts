import { NextRequest } from 'next/server'
import { requireAdmin, type AuthenticatedRequest } from '@/lib/middleware/auth'
import { getUserById, updateUser } from '@/lib/db/queries'
import type { User } from '@/lib/db/types'

async function handler(req: AuthenticatedRequest, { params }: { params: Promise<{ user_id: string }> | { user_id: string } }) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const userId = resolvedParams.user_id

    if (!userId) {
      return Response.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const user = await getUserById(userId)
    if (!user) {
      return Response.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Can't deactivate yourself
    if (userId === req.user!.userId) {
      return Response.json(
        { error: 'Cannot deactivate your own account' },
        { status: 400 }
      )
    }

    const updatedUser = await updateUser(userId, { is_active: false })
    if (!updatedUser) {
      return Response.json(
        { error: 'Failed to deactivate user' },
        { status: 500 }
      )
    }

    const { password_hash: _, ...userResponse } = updatedUser as User & { password_hash?: string }

    return Response.json({
      message: 'User deactivated successfully',
      user: userResponse,
    })
  } catch (error) {
    console.error('Admin deactivate user error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const POST = requireAdmin(handler)

