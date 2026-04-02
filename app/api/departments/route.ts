import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const departments = await prisma.department.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(departments);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (!["ADMIN", "HR"].includes(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const dept = await prisma.department.create({ data: { ...body, companyId: "default-company" } });
  return NextResponse.json(dept, { status: 201 });
}
