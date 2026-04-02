import AttendanceClient from "@/components/attendance/AttendanceClient";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export default async function AttendancePage() {
  const session = await auth();
  const employees = await prisma.employee.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, firstName: true, lastName: true, employeeCode: true, department: { select: { name: true } } },
    orderBy: { firstName: "asc" },
  });
  return <AttendanceClient employees={employees} session={session} />;
}
