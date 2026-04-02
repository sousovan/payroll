import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const shifts = await prisma.shift.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(shifts);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const shift = await prisma.shift.create({ data: body });
  return NextResponse.json(shift, { status: 201 });
}
