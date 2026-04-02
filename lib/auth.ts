import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { authConfig } from "@/lib/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
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
        try {
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
            if (employee.deviceSessions.length >= employee.maxDevices) {
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

        const user = {
          id: employee.id,
          email: employee.email,
          name: `${employee.firstName} ${employee.lastName}`,
          role: employee.role,
          employeeCode: employee.employeeCode,
          departmentId: employee.departmentId,
          departmentName: employee.department?.name,
        };
        return user;
        } catch(e: any) {
          throw e;
        }
      },
    }),
  ],
});
