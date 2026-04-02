import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (!["ADMIN", "HR", "MANAGER"].includes(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  const leave = await prisma.leave.update({
    where: { id },
    data: {
      status: body.status,
      approvedBy: body.status === "APPROVED" ? session.user!.id : undefined,
      approvedAt: body.status === "APPROVED" ? new Date() : undefined,
      rejectedReason: body.rejectedReason,
    },
  });

  // If approved, mark attendance records as ON_LEAVE
  if (body.status === "APPROVED") {
    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate);
    const dates: Date[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }
    for (const date of dates) {
      const dayStart = new Date(date); dayStart.setHours(0,0,0,0);
      await prisma.attendance.upsert({
        where: { employeeId_date: { employeeId: leave.employeeId, date: dayStart } },
        update: { status: "ON_LEAVE" },
        create: { employeeId: leave.employeeId, date: dayStart, status: "ON_LEAVE" },
      });
    }
  }

  return NextResponse.json(leave);
}
