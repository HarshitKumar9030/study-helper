import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcrypt";
import { UserModel } from "@/lib/models/user";
import connectMongo from "@/lib/mongodb";


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
      async authorize(credentials, req) {
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
          
          const passwordValid = await compare(credentials.password, user.password);
          
          if (!passwordValid) {
            return null;
          }
          return {
            id: (user._id as any).toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image || user.avatar?.url || undefined,
          };
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      }
    })
  ],
  
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  
  callbacks: {
  async jwt({ token, user }) {
      // Initial sign in - add user data to token
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.image = user.image;
      }
      
      return token;
    },
    
 async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.role = token.role as string;
        session.user.image = token.image as string;
      }
      
      return session;
    }
  },
  
  // Debug mode - set to true in development for detailed logs
  debug: process.env.NODE_ENV === "development",
};
