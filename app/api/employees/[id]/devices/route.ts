import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const devices = await prisma.deviceSession.findMany({ where: { employeeId: id } });
  return NextResponse.json(devices);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (!["ADMIN", "HR"].includes(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { deviceId } = await req.json();
  await prisma.deviceSession.updateMany({
    where: { employeeId: id, ...(deviceId ? { deviceId } : {}) },
    data: { isActive: false },
  });
  return NextResponse.json({ success: true });
}
