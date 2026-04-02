import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Company
  const company = await prisma.company.upsert({
    where: { id: "default-company" },
    update: {},
    create: {
      id: "default-company",
      name: "My Company Co., Ltd.",
      currency: "THB",
      workStartTime: "08:00",
      workEndTime: "17:00",
      workDays: "1,2,3,4,5",
      lateGraceMinutes: 5,
    },
  });

  // Settings
  await prisma.setting.upsert({
    where: { companyId_key: { companyId: company.id, key: "perfect_attendance_bonus" } },
    update: {},
    create: { companyId: company.id, key: "perfect_attendance_bonus", value: "500" },
  });

  // Department
  const dept = await prisma.department.upsert({
    where: { id: "dept-admin" },
    update: {},
    create: {
      id: "dept-admin",
      companyId: company.id,
      name: "Administration",
      bonusEnabled: true,
      bonusPercent: 5,
    },
  });

  // Leave Types
  const leaveTypes = [
    { id: "lt-annual", name: "Annual Leave", color: "#3b82f6", maxDaysPerYear: 12, isPaid: true },
    { id: "lt-sick", name: "Sick Leave", color: "#ef4444", maxDaysPerYear: 30, isPaid: true },
    { id: "lt-personal", name: "Personal Leave", color: "#f59e0b", maxDaysPerYear: 3, isPaid: false },
  ];
  for (const lt of leaveTypes) {
    await prisma.leaveType.upsert({ where: { id: lt.id }, update: {}, create: lt });
  }

  // Default shift
  await prisma.shift.upsert({
    where: { id: "shift-default" },
    update: {},
    create: {
      id: "shift-default",
      name: "Standard Shift",
      startTime: "08:00",
      endTime: "17:00",
      breakMinutes: 60,
      workDays: "1,2,3,4,5",
    },
  });

  // Admin user
  const hash = await bcrypt.hash("admin123", 12);
  await prisma.employee.upsert({
    where: { email: "admin@company.com" },
    update: {},
    create: {
      employeeCode: "EMP001",
      firstName: "Admin",
      lastName: "User",
      email: "admin@company.com",
      departmentId: dept.id,
      position: "System Administrator",
      role: "ADMIN",
      joinDate: new Date("2024-01-01"),
      baseSalary: 50000,
      salaryType: "MONTHLY",
      workHoursPerMonth: 192,
      maxDevices: 0,
      passwordHash: hash,
    },
  });

  console.log("Seed complete! Login: admin@company.com / admin123");
}

main().catch(console.error).finally(() => prisma.$disconnect());
