import { NextRequest, NextResponse } from 'next/server'

/**
 * CORS for the /api/* routes.
 *
 * The frontend (Vite, typically http://localhost:5173) and this backend
 * (Next.js, typically http://localhost:3000) run on different origins in
 * dev, and on separate hosts in most production deployments too. Any
 * request that carries a JSON body or an Authorization header (which is
 * every authenticated POST in this app — uploads, contributor applications,
 * etc.) triggers a CORS preflight OPTIONS request first. Without this
 * middleware there was no route handling OPTIONS and no
 * Access-Control-Allow-* headers on the real response, so the browser
 * blocked every such call before it reached the server — surfacing to the
 * user as a bare "Failed to fetch" with nothing in the Network tab body.
 *
 * ALLOWED_ORIGIN should be set to your deployed frontend's origin in
 * production (e.g. https://your-app.vercel.app). It defaults to '*' for
 * local development convenience only.
 */
const ALLOWED_ORIGIN = process.env.CORS_ALLOWED_ORIGIN || '*'

function withCors(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Max-Age', '86400')
  return response
}

export function middleware(request: NextRequest) {
  if (request.method === 'OPTIONS') {
    return withCors(new NextResponse(null, { status: 204 }))
  }
  return withCors(NextResponse.next())
}

export const config = {
  matcher: '/api/:path*',
}
