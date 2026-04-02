import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { startOfMonth, endOfMonth, eachWeekOfInterval, startOfWeek, endOfWeek } from "date-fns";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));

  const start = startOfMonth(new Date(year, month - 1));
  const end = endOfMonth(start);

  const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });

  const data = await Promise.all(
    weeks.map(async (weekStart, i) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const [present, absent, late] = await Promise.all([
        prisma.attendance.count({ where: { date: { gte: weekStart, lte: weekEnd }, status: { in: ["PRESENT", "OVERTIME"] } } }),
        prisma.attendance.count({ where: { date: { gte: weekStart, lte: weekEnd }, status: "ABSENT" } }),
        prisma.attendance.count({ where: { date: { gte: weekStart, lte: weekEnd }, status: "LATE" } }),
      ]);
      return { week: `W${i + 1}`, present, absent, late };
    })
  );

  return NextResponse.json(data);
}
