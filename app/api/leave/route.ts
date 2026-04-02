import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { differenceInBusinessDays } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const employeeId = searchParams.get("employeeId");
  const role = (session.user as any).role;

  let where: any = {};
  if (status) where.status = status;
  if (employeeId) where.employeeId = employeeId;
  if (!["ADMIN", "HR", "MANAGER"].includes(role)) {
    where.employeeId = session.user!.id;
  }

  const leaves = await prisma.leave.findMany({
    where,
    include: {
      employee: { select: { firstName: true, lastName: true, employeeCode: true, department: { select: { name: true } } } },
      leaveType: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(leaves);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const startDate = new Date(body.startDate);
  const endDate = new Date(body.endDate);
  const totalDays = Math.max(1, differenceInBusinessDays(endDate, startDate) + 1);

  const leave = await prisma.leave.create({
    data: {
      employeeId: body.employeeId || session.user!.id,
      leaveTypeId: body.leaveTypeId,
      startDate,
      endDate,
      totalDays,
      reason: body.reason,
      status: "PENDING",
    },
    include: { leaveType: true, employee: true },
  });
  return NextResponse.json(leave, { status: 201 });
}
