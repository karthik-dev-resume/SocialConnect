import { NextRequest } from 'next/server'
import { verifyAccessToken, extractTokenFromHeader, type TokenPayload } from '@/lib/auth'

export interface AuthenticatedRequest extends NextRequest {
  user?: TokenPayload
}

export async function authenticateRequest(request: NextRequest): Promise<TokenPayload | null> {
  const authHeader = request.headers.get('authorization')
  const token = extractTokenFromHeader(authHeader)

  if (!token) {
    return null
  }

  try {
    const payload = verifyAccessToken(token)
    return payload
  } catch (error) {
    return null
  }
}

type RouteContext = { params?: Promise<{ [key: string]: string }> | { [key: string]: string } }

export function requireAuth(handler: (req: AuthenticatedRequest, context: RouteContext) => Promise<Response>) {
  return async (req: NextRequest, context: RouteContext) => {
    const user = await authenticateRequest(req)
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const authenticatedReq = req as AuthenticatedRequest
    authenticatedReq.user = user
    
    return handler(authenticatedReq, context)
  }
}

export function requireAdmin(handler: (req: AuthenticatedRequest, context: RouteContext) => Promise<Response>) {
  return async (req: NextRequest, context: RouteContext) => {
    const user = await authenticateRequest(req)
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const authenticatedReq = req as AuthenticatedRequest
    authenticatedReq.user = user
    
    return handler(authenticatedReq, context)
  }
}

