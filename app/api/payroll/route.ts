import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { calculatePayroll } from "@/lib/payroll-calc";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));

  const payrolls = await prisma.payroll.findMany({
    where: { month, year },
    include: { employee: { include: { department: true } }, items: true },
    orderBy: { employee: { firstName: "asc" } },
  });
  return NextResponse.json(payrolls);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (!["ADMIN", "HR"].includes(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { month, year, employeeIds } = body;

  const employees = employeeIds
    ? await prisma.employee.findMany({ where: { id: { in: employeeIds }, status: "ACTIVE" } })
    : await prisma.employee.findMany({ where: { status: "ACTIVE" } });

  const results = [];
  for (const emp of employees) {
    try {
      const data = await calculatePayroll(emp.id, month, year);
      const payroll = await prisma.payroll.upsert({
        where: { employeeId_month_year: { employeeId: emp.id, month, year } },
        update: data,
        create: data,
      });
      results.push(payroll);
    } catch (e) {
      console.error(`Payroll calc failed for ${emp.id}:`, e);
    }
  }
  return NextResponse.json(results, { status: 201 });
}
