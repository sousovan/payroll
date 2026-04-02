import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { startOfDay } from "date-fns";

// Public endpoint for QR / GPS / WiFi check-in
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { qrToken, method, lat, lng, wifiSsid, deviceId } = body;

  // Verify token
  const employee = await prisma.employee.findFirst({ where: { qrToken } });
  if (!employee) return NextResponse.json({ error: "Invalid QR token" }, { status: 401 });
  if (employee.status !== "ACTIVE") return NextResponse.json({ error: "Employee inactive" }, { status: 403 });

  const now = new Date();
  const today = startOfDay(now);

  // Get company settings
  const company = await prisma.company.findFirst();
  let lateMinutes = 0;
  if (company) {
    const [sh, sm] = company.workStartTime.split(":").map(Number);
    const expected = new Date(today);
    expected.setHours(sh, sm + (company.lateGraceMinutes ?? 0), 0, 0);
    lateMinutes = Math.max(0, Math.floor((now.getTime() - expected.getTime()) / 60000));
  }

  const existing = await prisma.attendance.findUnique({
    where: { employeeId_date: { employeeId: employee.id, date: today } },
  });

  if (!existing) {
    // Check-in
    const record = await prisma.attendance.create({
      data: {
        employeeId: employee.id,
        date: today,
        checkIn: now,
        checkInMethod: method || "QR",
        checkInLat: lat,
        checkInLng: lng,
        checkInWifi: wifiSsid,
        checkInDevice: deviceId,
        status: lateMinutes > 0 ? "LATE" : "PRESENT",
        lateMinutes,
      },
    });
    return NextResponse.json({ action: "checkin", record, employee: { firstName: employee.firstName, lastName: employee.lastName } });
  } else if (!existing.checkOut) {
    // Check-out
    const totalMinutes = Math.floor((now.getTime() - (existing.checkIn?.getTime() ?? now.getTime())) / 60000);
    const company2 = company;
    let overtimeMinutes = 0;
    if (company2) {
      const [eh, em] = company2.workEndTime.split(":").map(Number);
      const expected = new Date(today);
      expected.setHours(eh, em, 0, 0);
      overtimeMinutes = Math.max(0, Math.floor((now.getTime() - expected.getTime()) / 60000));
    }
    const record = await prisma.attendance.update({
      where: { id: existing.id },
      data: {
        checkOut: now,
        checkOutMethod: method || "QR",
        checkOutLat: lat,
        checkOutLng: lng,
        checkOutWifi: wifiSsid,
        checkOutDevice: deviceId,
        totalMinutes,
        overtimeMinutes,
        status: overtimeMinutes > 30 ? "OVERTIME" : existing.status,
      },
    });
    return NextResponse.json({ action: "checkout", record, employee: { firstName: employee.firstName, lastName: employee.lastName } });
  } else {
    return NextResponse.json({ error: "Already checked in and out today" }, { status: 400 });
  }
}
