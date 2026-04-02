import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        deviceId: { label: "Device ID", type: "text" },
        deviceName: { label: "Device Name", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const employee = await prisma.employee.findUnique({
          where: { email: credentials.email as string },
          include: { department: true, deviceSessions: { where: { isActive: true } } },
        });

        if (!employee || employee.status !== "ACTIVE") return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          employee.passwordHash
        );
        if (!valid) return null;

        // Device limit check
        const deviceId = credentials.deviceId as string;
        if (deviceId && employee.maxDevices > 0) {
          const existingDevice = employee.deviceSessions.find(
            (d) => d.deviceId === deviceId
          );
          if (!existingDevice) {
            const activeCount = employee.deviceSessions.length;
            if (activeCount >= employee.maxDevices) {
              throw new Error("DEVICE_LIMIT_EXCEEDED");
            }
          }
        }

        // Upsert device session
        if (deviceId) {
          await prisma.deviceSession.upsert({
            where: { employeeId_deviceId: { employeeId: employee.id, deviceId } },
            update: { lastSeen: new Date(), isActive: true, deviceName: credentials.deviceName as string },
            create: {
              employeeId: employee.id,
              deviceId,
              deviceName: credentials.deviceName as string,
              isActive: true,
            },
          });
        }

        return {
          id: employee.id,
          email: employee.email,
          name: `${employee.firstName} ${employee.lastName}`,
          role: employee.role,
          employeeCode: employee.employeeCode,
          departmentId: employee.departmentId,
          departmentName: employee.department?.name,
        };
      },
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
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
});
