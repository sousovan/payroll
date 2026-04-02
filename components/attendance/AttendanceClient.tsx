"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Clock, Filter, Download, Search, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { formatDate, formatTime, minutesToHours } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  PRESENT: "bg-green-100 text-green-700",
  LATE: "bg-amber-100 text-amber-700",
  ABSENT: "bg-red-100 text-red-700",
  ON_LEAVE: "bg-blue-100 text-blue-700",
  OVERTIME: "bg-purple-100 text-purple-700",
  HALF_DAY: "bg-orange-100 text-orange-700",
  HOLIDAY: "bg-slate-100 text-slate-500",
};

const METHOD_ICONS: Record<string, string> = { QR: "📷", GPS: "📍", WIFI: "📶", MANUAL: "✏️" };

export default function AttendanceClient({ employees, session }: { employees: any[]; session: any }) {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [records, setRecords] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    employeeId: "", date: today, checkIn: "", checkOut: "", status: "PRESENT", note: "",
  });

  const role = (session?.user as any)?.role;
  const canEdit = ["ADMIN", "HR"].includes(role);

  useEffect(() => { fetchRecords(); }, [date]);

  async function fetchRecords() {
    setLoading(true);
    try {
      const res = await fetch(`/api/attendance?date=${date}`);
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/attendance", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...addForm,
        checkIn: addForm.checkIn ? `${addForm.date}T${addForm.checkIn}:00` : null,
        checkOut: addForm.checkOut ? `${addForm.date}T${addForm.checkOut}:00` : null,
      }),
    });
    if (res.ok) {
      toast.success("Attendance recorded!");
      setShowAdd(false);
      fetchRecords();
    } else {
      toast.error("Failed to record attendance");
    }
  }

  const filtered = records.filter((r) => {
    const name = `${r.employee?.firstName} ${r.employee?.lastName}`.toLowerCase();
    return name.includes(search.toLowerCase()) || r.employee?.employeeCode?.includes(search);
  });

  const stats = {
    present: records.filter(r => ["PRESENT", "OVERTIME"].includes(r.status)).length,
    late: records.filter(r => r.status === "LATE").length,
    absent: records.filter(r => r.status === "ABSENT").length,
    leave: records.filter(r => r.status === "ON_LEAVE").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Attendance</h1>
          <p className="text-slate-500 text-sm">Track daily attendance records</p>
        </div>
        {canEdit && (
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4 mr-2" />Record Attendance
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Present", value: stats.present, color: "text-green-600", bg: "bg-green-50", Icon: CheckCircle },
          { label: "Late", value: stats.late, color: "text-amber-600", bg: "bg-amber-50", Icon: AlertCircle },
          { label: "Absent", value: stats.absent, color: "text-red-600", bg: "bg-red-50", Icon: XCircle },
          { label: "On Leave", value: stats.leave, color: "text-blue-600", bg: "bg-blue-50", Icon: Clock },
        ].map(s => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`${s.bg} rounded-lg p-2`}><s.Icon className={`w-4 h-4 ${s.color}`} /></div>
              <div><p className="text-xs text-slate-500">{s.label}</p><p className="text-xl font-bold text-slate-800">{s.value}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 flex flex-wrap gap-3">
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-44" />
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input placeholder="Search employee..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Button variant="outline" onClick={fetchRecords}><Filter className="w-4 h-4 mr-1.5" />Refresh</Button>
        </CardContent>
      </Card>

      {/* Records */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {["Employee", "Date", "Check In", "Check Out", "Hours", "Late", "Status", "Method"].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-slate-500 text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-8 text-slate-400">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-8 text-slate-400">No records for this date</td></tr>
                ) : filtered.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-700">{r.employee?.firstName} {r.employee?.lastName}</p>
                      <p className="text-xs text-slate-400">{r.employee?.employeeCode}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(r.date)}</td>
                    <td className="px-4 py-3 text-slate-600">{r.checkIn ? formatTime(r.checkIn) : <span className="text-slate-300">—</span>}</td>
                    <td className="px-4 py-3 text-slate-600">{r.checkOut ? formatTime(r.checkOut) : <span className="text-slate-300">—</span>}</td>
                    <td className="px-4 py-3 text-slate-600">{r.totalMinutes ? minutesToHours(r.totalMinutes) : "—"}</td>
                    <td className="px-4 py-3">
                      {r.lateMinutes > 0 ? <span className="text-amber-600 font-medium">+{r.lateMinutes}m</span> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[r.status] ?? "bg-slate-100 text-slate-500"}`}>
                        {r.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{METHOD_ICONS[r.checkInMethod] ?? "✏️"} {r.checkInMethod}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Attendance</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Employee</Label>
              <Select value={addForm.employeeId} onValueChange={v => setAddForm(f => ({ ...f, employeeId: v ?? "" }))}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {employees.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeCode})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={addForm.date} onChange={e => setAddForm(f => ({ ...f, date: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Check In Time</Label><Input type="time" value={addForm.checkIn} onChange={e => setAddForm(f => ({ ...f, checkIn: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Check Out Time</Label><Input type="time" value={addForm.checkOut} onChange={e => setAddForm(f => ({ ...f, checkOut: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={addForm.status} onValueChange={v => setAddForm(f => ({ ...f, status: v ?? "PRESENT" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["PRESENT","LATE","ABSENT","HALF_DAY","ON_LEAVE","HOLIDAY","OVERTIME"].map(s => (
                    <SelectItem key={s} value={s}>{s.replace("_"," ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Note</Label><Input value={addForm.note} onChange={e => setAddForm(f => ({ ...f, note: e.target.value }))} placeholder="Optional note" /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
