import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (!["ADMIN", "HR"].includes(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  const payroll = await prisma.payroll.update({
    where: { id },
    data: {
      status: body.status,
      otherBonus: body.otherBonus,
      otherDeduction: body.otherDeduction,
      note: body.note,
      paidAt: body.status === "PAID" ? new Date() : undefined,
      netSalary: body.netSalary,
    },
  });
  return NextResponse.json(payroll);
}
