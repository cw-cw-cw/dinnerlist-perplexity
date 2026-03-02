import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import authConfig from "./auth.config";

declare module "next-auth" {
  interface User { role?: string; organizationId?: string; }
  interface Session {
    user: { id: string; email: string; name: string; role: string; organizationId: string; };
  }
}

declare module "@auth/core/jwt" {
  interface JWT { role?: string; organizationId?: string; }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = credentials.email as string;
        const password = credentials.password as string;
        const user = await prisma.adminUser.findUnique({
          where: { email: email.toLowerCase() },
          include: { organization: true },
        });
        if (!user) return null;
        const passwordMatch = await bcrypt.compare(password, user.hashedPassword);
        if (!passwordMatch) return null;
        return { id: user.id, email: user.email, name: user.name, role: user.role, organizationId: user.organizationId };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) { token.role = user.role; token.organizationId = user.organizationId; }
      return token;
    },
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
        session.user.role = token.role as string;
        session.user.organizationId = token.organizationId as string;
      }
      return session;
    },
  },
});
