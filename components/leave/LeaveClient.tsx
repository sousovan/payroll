"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, CheckCircle, XCircle, Clock, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  CANCELLED: "bg-slate-100 text-slate-500",
};

export default function LeaveClient({ leaveTypes, employees, session }: any) {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [tab, setTab] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    employeeId: "", leaveTypeId: "", startDate: "", endDate: "", reason: "",
  });
  const role = (session?.user as any)?.role;
  const canApprove = ["ADMIN", "HR", "MANAGER"].includes(role);
  const canManage = ["ADMIN", "HR"].includes(role);

  useEffect(() => { fetchLeaves(); }, [tab]);

  async function fetchLeaves() {
    const params = tab !== "all" ? `?status=${tab.toUpperCase()}` : "";
    const res = await fetch(`/api/leave${params}`);
    const data = await res.json();
    setLeaves(Array.isArray(data) ? data : []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/leave", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Leave request submitted!");
      setShowAdd(false);
      fetchLeaves();
    } catch {
      toast.error("Failed to submit leave request");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: string, rejectedReason?: string) {
    const res = await fetch(`/api/leave/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, rejectedReason }),
    });
    if (res.ok) {
      toast.success(`Leave ${status.toLowerCase()}!`);
      fetchLeaves();
    }
  }

  const tabs = ["all", "pending", "approved", "rejected"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Leave Management</h1>
          <p className="text-slate-500 text-sm">Manage employee leave requests</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4 mr-2" />Request Leave
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total", value: leaves.length, Icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Pending", value: leaves.filter(l => l.status === "PENDING").length, Icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Approved", value: leaves.filter(l => l.status === "APPROVED").length, Icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
          { label: "Rejected", value: leaves.filter(l => l.status === "REJECTED").length, Icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
        ].map(s => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`${s.bg} rounded-lg p-2`}><s.Icon className={`w-4 h-4 ${s.color}`} /></div>
              <div><p className="text-xs text-slate-500">{s.label}</p><p className="text-xl font-bold text-slate-800">{s.value}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {tabs.map(t => <TabsTrigger key={t} value={t} className="capitalize">{t}</TabsTrigger>)}
        </TabsList>
        <TabsContent value={tab}>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      {["Employee", "Leave Type", "Period", "Days", "Reason", "Status", canApprove ? "Actions" : ""].filter(Boolean).map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-8 text-slate-400">No leave requests</td></tr>
                    ) : leaves.map(l => (
                      <tr key={l.id} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-700">{l.employee?.firstName} {l.employee?.lastName}</p>
                          <p className="text-xs text-slate-400">{l.employee?.department?.name}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: l.leaveType?.color }} />
                          {l.leaveType?.name}
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-xs">
                          {formatDate(l.startDate)} → {formatDate(l.endDate)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{l.totalDays}d</td>
                        <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{l.reason || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[l.status]}`}>{l.status}</span>
                        </td>
                        {canApprove && (
                          <td className="px-4 py-3">
                            {l.status === "PENDING" && (
                              <div className="flex gap-1.5">
                                <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700"
                                  onClick={() => updateStatus(l.id, "APPROVED")}>Approve</Button>
                                <Button size="sm" variant="outline" className="h-7 text-xs text-red-600"
                                  onClick={() => updateStatus(l.id, "REJECTED", "Rejected by manager")}>Reject</Button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request Leave</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {canManage && (
              <div className="space-y-1.5">
                <Label>Employee</Label>
                <Select value={form.employeeId} onValueChange={v => setForm(f => ({ ...f, employeeId: v ?? "" }))}>
                  <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent>{employees.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Leave Type</Label>
              <Select value={form.leaveTypeId} onValueChange={v => setForm(f => ({ ...f, leaveTypeId: v ?? "" }))}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>{leaveTypes.map((lt: any) => <SelectItem key={lt.id} value={lt.id}>{lt.name} ({lt.isPaid ? "Paid" : "Unpaid"})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Start Date</Label><Input type="date" required value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>End Date</Label><Input type="date" required value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5"><Label>Reason</Label><Input value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Optional reason" /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">Submit Request</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
