import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import QRCode from "qrcode";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const employee = await prisma.employee.findUnique({ where: { id } });
  if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data = JSON.stringify({ token: employee.qrToken, employeeId: employee.id });
  const png = await QRCode.toBuffer(data, { width: 300, margin: 2 });
  return new NextResponse(png as unknown as BodyInit, { headers: { "Content-Type": "image/png" } });
}
