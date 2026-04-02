import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import EmployeeDetail from "@/components/employees/EmployeeDetail";

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [employee, departments, shifts] = await Promise.all([
    prisma.employee.findUnique({
      where: { id },
      include: { department: true, deviceSessions: { orderBy: { lastSeen: "desc" } }, shiftAssignments: { include: { shift: true }, orderBy: { effectiveFrom: "desc" }, take: 1 } },
    }),
    prisma.department.findMany(),
    prisma.shift.findMany(),
  ]);
  if (!employee) notFound();
  return <EmployeeDetail employee={employee} departments={departments} shifts={shifts} />;
}
