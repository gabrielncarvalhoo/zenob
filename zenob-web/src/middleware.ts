import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';

export function middleware(req: Request) {
  const { session } = auth();
  // Clerk session token is available via session.getToken()
  // We can add it to headers for API calls
  return NextResponse.next();
}

// Keep this export to enable the middleware matcher
export const config = {
  matcher: [],
};