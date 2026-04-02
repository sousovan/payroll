import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

// Auth config WITHOUT any DB imports — safe for Edge Runtime
export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        deviceId: { label: "Device ID", type: "text" },
        deviceName: { label: "Device Name", type: "text" },
      },
      // authorize runs only on the Node.js runtime (API route), not edge
      authorize: async () => null,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.employeeCode = (user as any).employeeCode;
        token.departmentId = (user as any).departmentId;
        token.departmentName = (user as any).departmentName;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).employeeCode = token.employeeCode;
        (session.user as any).departmentId = token.departmentId;
        (session.user as any).departmentName = token.departmentName;
      }
      return session;
    },
  },
  pages: { signIn: "/login", error: "/login" },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};
