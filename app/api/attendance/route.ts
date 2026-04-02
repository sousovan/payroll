import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { startOfDay, endOfDay } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const date = searchParams.get("date");
  const employeeId = searchParams.get("employeeId");
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  let where: any = {};

  if (date) {
    const d = new Date(date);
    where.date = { gte: startOfDay(d), lte: endOfDay(d) };
  } else if (month && year) {
    const start = new Date(parseInt(year), parseInt(month) - 1, 1);
    const end = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
    where.date = { gte: start, lte: end };
  }

  if (employeeId) where.employeeId = employeeId;

  // Non-admin/HR can only see their own
  const role = (session.user as any).role;
  if (!["ADMIN", "HR", "MANAGER"].includes(role)) {
    where.employeeId = session.user!.id;
  }

  const records = await prisma.attendance.findMany({
    where,
    include: { employee: { select: { firstName: true, lastName: true, employeeCode: true, department: { select: { name: true } } } } },
    orderBy: [{ date: "desc" }, { checkIn: "desc" }],
    take: 200,
  });

  return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (!["ADMIN", "HR"].includes(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const date = new Date(body.date);
  date.setHours(0, 0, 0, 0);

  // Get company settings for late calculation
  const company = await prisma.company.findFirst();
  let lateMinutes = 0;
  if (body.checkIn && company) {
    const [sh, sm] = company.workStartTime.split(":").map(Number);
    const expected = new Date(date);
    expected.setHours(sh, sm + (company.lateGraceMinutes ?? 0), 0, 0);
    const actual = new Date(body.checkIn);
    lateMinutes = Math.max(0, Math.floor((actual.getTime() - expected.getTime()) / 60000));
  }

  let totalMinutes = 0;
  if (body.checkIn && body.checkOut) {
    totalMinutes = Math.floor((new Date(body.checkOut).getTime() - new Date(body.checkIn).getTime()) / 60000);
  }

  const attendance = await prisma.attendance.upsert({
    where: { employeeId_date: { employeeId: body.employeeId, date } },
    update: {
      checkIn: body.checkIn ? new Date(body.checkIn) : undefined,
      checkOut: body.checkOut ? new Date(body.checkOut) : undefined,
      status: body.status || (lateMinutes > 0 ? "LATE" : "PRESENT"),
      lateMinutes,
      totalMinutes,
      note: body.note,
    },
    create: {
      employeeId: body.employeeId,
      date,
      checkIn: body.checkIn ? new Date(body.checkIn) : undefined,
      checkOut: body.checkOut ? new Date(body.checkOut) : undefined,
      status: body.status || (lateMinutes > 0 ? "LATE" : "PRESENT"),
      lateMinutes,
      totalMinutes,
      note: body.note,
    },
  });

  return NextResponse.json(attendance, { status: 201 });
}
