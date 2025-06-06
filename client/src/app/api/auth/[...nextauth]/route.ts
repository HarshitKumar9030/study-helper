import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * NextAuth.js Route Handler for App Router
 * 
 * This file creates the authentication API routes at /api/auth/[...nextauth]
 * These routes handle sign-in, sign-out, sessions, callbacks, etc.
 * 
 * The Python backend will need to validate tokens with a compatible JWT library
 * and will need to use the same secret for validation.
 */
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
