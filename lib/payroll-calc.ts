import { prisma } from "@/lib/db";
import { startOfMonth, endOfMonth, getDaysInMonth, getDay } from "date-fns";

export async function calculatePayroll(employeeId: string, month: number, year: number) {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { department: true },
  });
  if (!employee) throw new Error("Employee not found");

  const company = await prisma.company.findFirst();
  if (!company) throw new Error("Company not configured");

  const start = startOfMonth(new Date(year, month - 1));
  const end = endOfMonth(start);

  // Get attendance records for the month
  const attendances = await prisma.attendance.findMany({
    where: { employeeId, date: { gte: start, lte: end } },
  });

  // Get leaves
  const leaves = await prisma.leave.findMany({
    where: {
      employeeId,
      status: "APPROVED",
      startDate: { lte: end },
      endDate: { gte: start },
    },
    include: { leaveType: true },
  });

  // Get holidays
  const holidays = await prisma.holiday.findMany({
    where: { date: { gte: start, lte: end } },
  });

  // Count working days (exclude weekends and holidays)
  const workDays = company.workDays.split(",").map(Number);
  let workingDays = 0;
  const holidayDates = new Set(holidays.map((h) => h.date.toISOString().split("T")[0]));

  const daysInMonth = getDaysInMonth(start);
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    const dayOfWeek = getDay(date); // 0=Sun, 1=Mon...
    const mapped = dayOfWeek === 0 ? 7 : dayOfWeek;
    const dateStr = date.toISOString().split("T")[0];
    if (workDays.includes(mapped) && !holidayDates.has(dateStr)) {
      workingDays++;
    }
  }

  // Salary per minute
  const workHoursPerMonth = employee.workHoursPerMonth;
  const salaryPerMinute = employee.baseSalary / (workHoursPerMonth * 60);
  const salaryPerDay = employee.baseSalary / workingDays;

  // Count stats
  const presentDays = attendances.filter((a) => ["PRESENT", "LATE", "OVERTIME"].includes(a.status)).length;
  const absentDays = attendances.filter((a) => a.status === "ABSENT").length;
  const lateDays = attendances.filter((a) => a.lateMinutes > 0).length;
  const totalLateMinutes = attendances.reduce((sum, a) => sum + a.lateMinutes, 0);
  const overtimeMinutes = attendances.reduce((sum, a) => sum + a.overtimeMinutes, 0);
  const leaveDaysUsed = leaves.reduce((sum, l) => sum + l.totalDays, 0);

  // Deductions
  const lateDeduction = salaryPerMinute * totalLateMinutes;
  const absentDeduction = salaryPerDay * absentDays;
  const unpaidLeaveDays = leaves
    .filter((l) => !l.leaveType.isPaid)
    .reduce((sum, l) => sum + l.totalDays, 0);
  const leaveDeduction = salaryPerDay * unpaidLeaveDays;

  // Overtime pay
  const overtimeRate = employee.department?.overtimeRate ?? 1.5;
  const overtimePay = salaryPerMinute * overtimeRate * overtimeMinutes;

  // Department bonus
  let departmentBonus = 0;
  if (employee.department?.bonusEnabled) {
    departmentBonus = employee.baseSalary * (employee.department.bonusPercent / 100);
  }

  // Perfect attendance bonus (no late, no leave)
  let bonusAmount = 0;
  const bonusSetting = await prisma.setting.findFirst({
    where: { key: "perfect_attendance_bonus" },
  });
  if (bonusSetting && leaveDaysUsed === 0 && lateDays === 0 && absentDays === 0) {
    bonusAmount = parseFloat(bonusSetting.value) || 0;
  }

  const netSalary =
    employee.baseSalary +
    overtimePay +
    departmentBonus +
    bonusAmount -
    lateDeduction -
    absentDeduction -
    leaveDeduction;

  return {
    employeeId,
    month,
    year,
    workingDays,
    presentDays,
    absentDays,
    lateDays,
    totalLateMinutes,
    overtimeMinutes,
    leaveDaysUsed,
    baseSalary: employee.baseSalary,
    overtimePay,
    lateDeduction,
    absentDeduction,
    leaveDeduction,
    bonusAmount,
    departmentBonus,
    otherBonus: 0,
    otherDeduction: 0,
    netSalary: Math.max(0, netSalary),
    status: "DRAFT" as const,
  };
}
