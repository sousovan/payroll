import LeaveClient from "@/components/leave/LeaveClient";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export default async function LeavePage() {
  const session = await auth();
  const [leaveTypes, employees] = await Promise.all([
    prisma.leaveType.findMany(),
    prisma.employee.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, firstName: true, lastName: true, employeeCode: true },
    }),
  ]);
  return <LeaveClient leaveTypes={leaveTypes} employees={employees} session={session} />;
}
