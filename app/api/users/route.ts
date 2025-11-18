import { NextRequest } from 'next/server'
import { listUsers } from '@/lib/db/queries'
import { requireAdmin, type AuthenticatedRequest } from '@/lib/middleware/auth'
import type { User } from '@/lib/db/types'

async function handler(req: AuthenticatedRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const users = await listUsers(limit, offset)

    // Remove password_hash from all users
    const sanitizedUsers = users.map((user) => {
      const { password_hash: _, ...sanitized } = user as User & { password_hash?: string }
      return sanitized
    })

    return Response.json({
      results: sanitizedUsers,
      count: sanitizedUsers.length,
    })
  } catch (error) {
    console.error('List users error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = requireAdmin(handler)

