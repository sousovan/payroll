"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from "recharts";
import { Download, BarChart3, PieChartIcon, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function ReportsClient() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [payrollData, setPayrollData] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/payroll?month=${month}&year=${year}`).then(r => r.json()).then(d => setPayrollData(Array.isArray(d) ? d : []));
    fetch(`/api/reports/attendance-chart?month=${month}&year=${year}`).then(r => r.json()).then(d => setAttendanceData(Array.isArray(d) ? d : []));
  }, [month, year]);

  const deptPayroll = payrollData.reduce((acc: any, p: any) => {
    const dept = p.employee?.department?.name || "Other";
    if (!acc[dept]) acc[dept] = { name: dept, net: 0, count: 0 };
    acc[dept].net += p.netSalary;
    acc[dept].count++;
    return acc;
  }, {});
  const deptChart = Object.values(deptPayroll);

  const statusPie = [
    { name: "Present", value: attendanceData.reduce((s: number, d: any) => s + (d.present || 0), 0) },
    { name: "Absent", value: attendanceData.reduce((s: number, d: any) => s + (d.absent || 0), 0) },
    { name: "Late", value: attendanceData.reduce((s: number, d: any) => s + (d.late || 0), 0) },
  ].filter(d => d.value > 0);

  const salaryByEmployee = payrollData.slice(0, 10).map(p => ({
    name: `${p.employee?.firstName} ${p.employee?.lastName?.charAt(0)}.`,
    base: p.baseSalary,
    net: p.netSalary,
    bonus: p.bonusAmount + p.departmentBonus + p.otherBonus,
    deduction: p.lateDeduction + p.absentDeduction,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reports</h1>
          <p className="text-slate-500 text-sm">Analytics for {MONTHS[month-1]} {year}</p>
        </div>
        <div className="flex gap-2">
          <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i} value={String(i+1)}>{m}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>{[year-1,year,year+1].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="w-4 h-4 text-blue-600" />Salary by Employee (Top 10)</CardTitle></CardHeader>
          <CardContent>
            {salaryByEmployee.length === 0 ? <p className="text-center text-slate-400 text-sm py-6">Generate payroll to see data</p> : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salaryByEmployee} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => formatCurrency(v).replace("฿","")} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={60} />
                    <Tooltip formatter={(v: any) => formatCurrency(v)} />
                    <Bar dataKey="base" fill="#94a3b8" name="Base" radius={[0,4,4,0]} />
                    <Bar dataKey="bonus" fill="#10b981" name="Bonus" stackId="a" />
                    <Bar dataKey="net" fill="#3b82f6" name="Net" radius={[0,4,4,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><PieChartIcon className="w-4 h-4 text-blue-600" />Attendance Overview</CardTitle></CardHeader>
          <CardContent>
            {statusPie.length === 0 ? <p className="text-center text-slate-400 text-sm py-6">No attendance data</p> : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusPie} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={(entry: any) => `${entry.name} ${((entry.percent ?? 0)*100).toFixed(0)}%`} labelLine={false}>
                      {statusPie.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-600" />Attendance Trend (Weekly)</CardTitle></CardHeader>
          <CardContent>
            {attendanceData.length === 0 ? <p className="text-center text-slate-400 text-sm py-6">No data</p> : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="present" stroke="#3b82f6" strokeWidth={2} name="Present" dot={false} />
                    <Line type="monotone" dataKey="late" stroke="#f59e0b" strokeWidth={2} name="Late" dot={false} />
                    <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} name="Absent" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Payroll by Department</CardTitle></CardHeader>
          <CardContent>
            {deptChart.length === 0 ? <p className="text-center text-slate-400 text-sm py-6">No data</p> : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: any) => formatCurrency(v)} />
                    <Bar dataKey="net" fill="#3b82f6" radius={[4,4,0,0]} name="Net Salary" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
