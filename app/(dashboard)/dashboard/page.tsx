import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, DollarSign, CalendarX, TrendingUp, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { startOfMonth, endOfMonth } from "date-fns";
import AttendanceChart from "@/components/dashboard/AttendanceChart";
import RecentAttendance from "@/components/dashboard/RecentAttendance";

export default async function DashboardPage() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [totalEmployees, activeToday, pendingLeaves, monthPayroll] = await Promise.all([
    prisma.employee.count({ where: { status: "ACTIVE" } }),
    prisma.attendance.count({
      where: {
        date: { gte: new Date(now.toDateString()) },
        status: { in: ["PRESENT", "LATE", "OVERTIME"] },
      },
    }),
    prisma.leave.count({ where: { status: "PENDING" } }),
    prisma.payroll.aggregate({
      where: {
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        status: { in: ["APPROVED", "PAID"] },
      },
      _sum: { netSalary: true },
    }),
  ]);

  const recentAttendances = await prisma.attendance.findMany({
    where: { date: { gte: new Date(now.toDateString()) } },
    include: { employee: { include: { department: true } } },
    orderBy: { checkIn: "desc" },
    take: 8,
  });

  const stats = [
    { label: "Total Employees", value: totalEmployees, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Present Today", value: activeToday, icon: Clock, color: "text-green-600", bg: "bg-green-50" },
    { label: "Pending Leaves", value: pendingLeaves, icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Month Payroll", value: formatCurrency(monthPayroll._sum.netSalary ?? 0), icon: DollarSign, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Overview of your workforce</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{s.label}</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{s.value}</p>
                </div>
                <div className={`${s.bg} rounded-xl p-3`}>
                  <s.icon className={`w-6 h-6 ${s.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-700 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Attendance This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AttendanceChart month={now.getMonth() + 1} year={now.getFullYear()} />
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-700 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Today's Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RecentAttendance data={recentAttendances} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
