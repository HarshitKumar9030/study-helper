import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcrypt";
import { UserModel } from "@/lib/models/user";
import connectMongo from "@/lib/mongodb";

/**
 * Key components:
 * 1. JWT-based sessions (easier to share with external services like Python)
 * 2. Custom token callbacks for additional user data
 * 3. MongoDB integration for user authentication
 * 4. Secure credential validation
 */

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    // 30 days max session length
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  // Configure JWT behavior for Python compatibility
  jwt: {
    // Maximum age of the JWT in seconds (30 days)
    maxAge: 30 * 24 * 60 * 60,
  },
  
  secret: process.env.NEXTAUTH_SECRET,
  
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      
      /**
       * Validates user credentials against MongoDB
       * 
       * @param credentials - User-provided credentials
       * @returns authenticated user object or null
       */
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        
        try {
          // Connect to MongoDB
          await connectMongo();
          
          // Find user by email
          const user = await UserModel.findOne({ email: credentials.email });
          
          if (!user) {
            return null;
          }
          
          // Verify password
          const passwordValid = await compare(credentials.password, user.password);
          
          if (!passwordValid) {
            return null;
          }
          
          // Return user object without sensitive data
          return {
            id: (user._id as any).toString(),
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      }
    })
  ],
  
  // Custom pages for authentication flows
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  
  callbacks: {
    /**
     * JWT Callback - Runs when JWT is created or updated
     * This is where we can add custom claims to the JWT token
     * The Python app will need to understand this token structure
     */
    async jwt({ token, user }) {
      // Initial sign in - add user data to token
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
      }
      
      return token;
    },
    
    /**
     * Session Callback - Creates the session object from the token
     * This defines what data is available to the client
     */
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.role = token.role as string;
      }
      
      return session;
    }
  },
  
  // Debug mode - set to true in development for detailed logs
  debug: process.env.NODE_ENV === "development",
};
