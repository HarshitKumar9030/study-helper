import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * This endpoint verifies a user's authentication status and returns session data.
 * The Python backend can call this endpoint to verify user tokens or implement
 * similar verification logic using the same JWT secret.
 * 
 * @param request - The incoming request
 * @returns User session data or unauthorized status
 */

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401 }
    );
  }

  // Return minimal necessary session data
  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
    },
  });
}

/*
     Call this endpoint with the user's session cookie to verify authentication
    Example: requests.get('https://app.com/api/auth/verify', cookies=user_cookies)

 */
