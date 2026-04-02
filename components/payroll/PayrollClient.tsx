"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, DollarSign, TrendingUp, TrendingDown, FileText, Loader2 } from "lucide-react";
import { formatCurrency, minutesToHours } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  APPROVED: "bg-blue-100 text-blue-700",
  PAID: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function PayrollClient({ session }: { session: any }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const role = (session?.user as any)?.role;
  const canEdit = ["ADMIN", "HR"].includes(role);

  useEffect(() => { fetchPayrolls(); }, [month, year]);

  async function fetchPayrolls() {
    setLoading(true);
    try {
      const res = await fetch(`/api/payroll?month=${month}&year=${year}`);
      const data = await res.json();
      setPayrolls(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  async function generatePayroll() {
    setGenerating(true);
    try {
      const res = await fetch("/api/payroll", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, year }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Payroll generated!");
      fetchPayrolls();
    } catch {
      toast.error("Failed to generate payroll");
    } finally {
      setGenerating(false);
    }
  }

  async function updatePayroll(id: string, data: any) {
    const res = await fetch(`/api/payroll/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    if (res.ok) {
      toast.success("Payroll updated!");
      fetchPayrolls();
      setSelected(null);
    }
  }

  const totals = {
    baseSalary: payrolls.reduce((s, p) => s + p.baseSalary, 0),
    net: payrolls.reduce((s, p) => s + p.netSalary, 0),
    deductions: payrolls.reduce((s, p) => s + p.lateDeduction + p.absentDeduction + p.leaveDeduction + p.otherDeduction, 0),
    bonuses: payrolls.reduce((s, p) => s + p.bonusAmount + p.departmentBonus + p.overtimePay + p.otherBonus, 0),
  };

  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Payroll Management</h1>
          <p className="text-slate-500 text-sm">{MONTHS[month-1]} {year}</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i} value={String(i+1)}>{m}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
          </Select>
          {canEdit && (
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={generatePayroll} disabled={generating}>
              {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Generate
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Base", value: formatCurrency(totals.baseSalary), Icon: DollarSign, color: "text-slate-600", bg: "bg-slate-50" },
          { label: "Total Bonuses", value: formatCurrency(totals.bonuses), Icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
          { label: "Total Deductions", value: formatCurrency(totals.deductions), Icon: TrendingDown, color: "text-red-600", bg: "bg-red-50" },
          { label: "Net Payroll", value: formatCurrency(totals.net), Icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
        ].map(s => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`${s.bg} rounded-lg p-2`}><s.Icon className={`w-4 h-4 ${s.color}`} /></div>
              <div><p className="text-xs text-slate-500">{s.label}</p><p className="text-sm font-bold text-slate-800">{s.value}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {["Employee", "Dept", "Base", "OT", "Bonuses", "Deductions", "Net", "Status", ""].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="text-center py-8 text-slate-400">Loading...</td></tr>
                ) : payrolls.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-8 text-slate-400">No payroll for this period. Click Generate.</td></tr>
                ) : payrolls.map(p => (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer" onClick={() => setSelected(p)}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-700">{p.employee?.firstName} {p.employee?.lastName}</p>
                      <p className="text-xs text-slate-400">{p.employee?.employeeCode}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{p.employee?.department?.name || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{formatCurrency(p.baseSalary)}</td>
                    <td className="px-4 py-3 text-green-600">{formatCurrency(p.overtimePay)}</td>
                    <td className="px-4 py-3 text-green-600">{formatCurrency(p.bonusAmount + p.departmentBonus + p.otherBonus)}</td>
                    <td className="px-4 py-3 text-red-500">{formatCurrency(p.lateDeduction + p.absentDeduction + p.leaveDeduction + p.otherDeduction)}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{formatCurrency(p.netSalary)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[p.status]}`}>{p.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      {canEdit && p.status === "DRAFT" && (
                        <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
                          onClick={(e) => { e.stopPropagation(); updatePayroll(p.id, { status: "APPROVED", netSalary: p.netSalary }); }}>
                          Approve
                        </Button>
                      )}
                      {canEdit && p.status === "APPROVED" && (
                        <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700"
                          onClick={(e) => { e.stopPropagation(); updatePayroll(p.id, { status: "PAID", netSalary: p.netSalary }); }}>
                          Mark Paid
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      {selected && (
        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Payroll Detail — {selected.employee?.firstName} {selected.employee?.lastName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["Working Days", selected.workingDays],
                  ["Present Days", selected.presentDays],
                  ["Absent Days", selected.absentDays],
                  ["Late Days", selected.lateDays],
                  ["Late Time", minutesToHours(selected.totalLateMinutes)],
                  ["Overtime", minutesToHours(selected.overtimeMinutes)],
                  ["Leave Used", `${selected.leaveDaysUsed}d`],
                ].map(([k, v]) => (
                  <div key={k} className="bg-slate-50 rounded-lg p-2">
                    <p className="text-xs text-slate-400">{k}</p>
                    <p className="font-semibold text-slate-700">{v}</p>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3 space-y-1.5">
                <div className="flex justify-between"><span className="text-slate-500">Base Salary</span><span>{formatCurrency(selected.baseSalary)}</span></div>
                <div className="flex justify-between text-green-600"><span>Overtime Pay</span><span>+{formatCurrency(selected.overtimePay)}</span></div>
                <div className="flex justify-between text-green-600"><span>Perfect Bonus</span><span>+{formatCurrency(selected.bonusAmount)}</span></div>
                <div className="flex justify-between text-green-600"><span>Dept Bonus</span><span>+{formatCurrency(selected.departmentBonus)}</span></div>
                <div className="flex justify-between text-red-500"><span>Late Deduction</span><span>-{formatCurrency(selected.lateDeduction)}</span></div>
                <div className="flex justify-between text-red-500"><span>Absent Deduction</span><span>-{formatCurrency(selected.absentDeduction)}</span></div>
                <div className="flex justify-between text-red-500"><span>Leave Deduction</span><span>-{formatCurrency(selected.leaveDeduction)}</span></div>
                <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Net Salary</span><span className="text-blue-700">{formatCurrency(selected.netSalary)}</span></div>
              </div>
              {canEdit && selected.status === "DRAFT" && (
                <div className="grid grid-cols-2 gap-3 border-t pt-3">
                  <div className="space-y-1"><Label className="text-xs">Other Bonus</Label>
                    <Input type="number" defaultValue={selected.otherBonus}
                      onChange={e => setSelected((s: any) => ({ ...s, otherBonus: Number(e.target.value) }))} /></div>
                  <div className="space-y-1"><Label className="text-xs">Other Deduction</Label>
                    <Input type="number" defaultValue={selected.otherDeduction}
                      onChange={e => setSelected((s: any) => ({ ...s, otherDeduction: Number(e.target.value) }))} /></div>
                  <div className="col-span-2">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={() => updatePayroll(selected.id, {
                        otherBonus: selected.otherBonus,
                        otherDeduction: selected.otherDeduction,
                        netSalary: selected.netSalary + (selected.otherBonus || 0) - (selected.otherDeduction || 0),
                        note: selected.note,
                      })}>Save Adjustments</Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
