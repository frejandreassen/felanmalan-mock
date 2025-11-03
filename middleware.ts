import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Skip password check if APP_PASSWORD is not set
  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword) {
    return NextResponse.next();
  }

  // Check if user is already authenticated
  const authCookie = request.cookies.get('app_auth');
  if (authCookie?.value === appPassword) {
    return NextResponse.next();
  }

  // Allow access to login page and API routes
  if (request.nextUrl.pathname === '/login' ||
      request.nextUrl.pathname.startsWith('/api/') ||
      request.nextUrl.pathname.startsWith('/_next/')) {
    return NextResponse.next();
  }

  // Redirect to login page
  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
