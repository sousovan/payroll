import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const employees = await prisma.employee.findMany({
    include: { department: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(employees);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (!["ADMIN", "HR"].includes(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { password, ...data } = body;
  const passwordHash = await bcrypt.hash(password || "changeme123", 12);

  const employee = await prisma.employee.create({
    data: { ...data, passwordHash, joinDate: new Date(data.joinDate) },
  });
  return NextResponse.json(employee, { status: 201 });
}
