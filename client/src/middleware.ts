import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';


// Define routes that require authentication
const authRequiredPaths = [
  '/dashboard',
  '/scheduler',
  '/focus',
  '/analytics',
  '/voice-assistant', 
  '/chat',
  '/profile',
  '/settings',
];

// Define routes that are always public (no auth check)
const publicPaths = [
  '/',
  '/auth/signin',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/error',
  '/api/auth',
];


const apiPaths = [
  '/api/user',
  '/api/scheduler',
  '/api/focus',
  '/api/chat',
  '/api/voice',
  '/api/profile',
  '/api/upload',
];


export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') // Files with extensions (images, etc.)
  ) {
    return NextResponse.next();
  }

  const isAuthRequired = authRequiredPaths.some(path => pathname.startsWith(path));
  const isApiPath = apiPaths.some(path => pathname.startsWith(path));
  
  if (!isAuthRequired && !isApiPath) {
    return NextResponse.next();
  }

  // Verify the session token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    if (isApiPath) {
      // For API routes, return 401 Unauthorized instead of redirecting
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    } else {
      const url = new URL('/auth/signin', request.url);
      url.searchParams.set('callbackUrl', encodeURI(request.url));
      return NextResponse.redirect(url);
    }
  }


  const response = NextResponse.next();
  

  response.headers.set('x-user-id', token.id as string);
  
  if (token.role) {
    response.headers.set('x-user-role', token.role as string);
  }

  return response;
}


export const config = {
  matcher: [

    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
