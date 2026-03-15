import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"

// Config ligera para el middleware (Edge runtime — sin Node.js modules)
export const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    // El authorize real está en auth.ts — aquí solo declaramos el provider
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async () => null, // overridden in auth.ts
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
}
