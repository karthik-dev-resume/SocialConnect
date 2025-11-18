import { NextRequest } from 'next/server'
import { requireAdmin, type AuthenticatedRequest } from '@/lib/middleware/auth'
import { getUserById, getUserStats } from '@/lib/db/queries'
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

    const stats = await getUserStats(userId)
    const { password_hash: _, ...userResponse } = user as User & { password_hash?: string }

    return Response.json({
      ...userResponse,
      ...stats,
    })
  } catch (error) {
    console.error('Admin get user error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = requireAdmin(handler)

