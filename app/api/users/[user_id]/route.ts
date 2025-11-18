import { NextRequest } from 'next/server'
import { getUserById, getUserStats } from '@/lib/db/queries'
import { requireAuth, type AuthenticatedRequest } from '@/lib/middleware/auth'
import type { User } from '@/lib/db/types'

async function handler(req: AuthenticatedRequest, { params }: { params: Promise<{ user_id: string }> | { user_id: string } }) {
  try {
    // Handle both Promise and direct params (Next.js 15+ vs older versions)
    const resolvedParams = params instanceof Promise ? await params : params
    const userId = resolvedParams.user_id

    if (!userId) {
      console.error('User ID is missing from route parameters')
      return Response.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const user = await getUserById(userId)
    if (!user) {
      console.error(`User not found: ${userId}`)
      return Response.json(
        { error: 'User not found', userId },
        { status: 404 }
      )
    }

    // Allow viewing profile regardless of visibility
    // Posts will be filtered separately based on visibility

    const stats = await getUserStats(userId)
    const { password_hash: _, ...userResponse } = user as User & { password_hash?: string }

    return Response.json({
      ...userResponse,
      ...stats,
    })
  } catch (error) {
    console.error('Get user error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = requireAuth(handler)

