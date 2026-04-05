import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Client-side auth check happens in AppLayout, but we can add
// basic redirect logic here for unauthenticated API-level protection
export function middleware(request: NextRequest) {
  // Allow all routes - auth is handled client-side via Firebase
  // The AppLayout component checks auth state and redirects to /auth/login
  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*'],
};
