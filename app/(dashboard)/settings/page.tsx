import SettingsClient from "@/components/settings/SettingsClient";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!["ADMIN", "HR"].includes(role)) redirect("/dashboard");

  const [company, departments, shifts, leaveTypes, settings] = await Promise.all([
    prisma.company.findFirst(),
    prisma.department.findMany({ include: { _count: { select: { employees: true } } } }),
    prisma.shift.findMany(),
    prisma.leaveType.findMany(),
    prisma.setting.findMany({ where: { companyId: "default-company" } }),
  ]);

  return (
    <SettingsClient
      company={company}
      departments={departments}
      shifts={shifts}
      leaveTypes={leaveTypes}
      settings={settings}
    />
  );
}
