"use client";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Building2, Briefcase, Clock, Calendar, Settings2, Plus, Trash2, Edit, Save } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function SettingsClient({ company, departments, shifts, leaveTypes, settings }: any) {
  const router = useRouter();
  const [companyForm, setCompanyForm] = useState({
    name: company?.name || "",
    email: company?.email || "",
    phone: company?.phone || "",
    address: company?.address || "",
    taxId: company?.taxId || "",
    currency: company?.currency || "THB",
    workStartTime: company?.workStartTime || "08:00",
    workEndTime: company?.workEndTime || "17:00",
    lateGraceMinutes: company?.lateGraceMinutes || 0,
    workDays: company?.workDays || "1,2,3,4,5",
  });

  const settingsMap = Object.fromEntries(settings.map((s: any) => [s.key, s.value]));
  const [settingVals, setSettingVals] = useState({
    perfect_attendance_bonus: settingsMap.perfect_attendance_bonus || "0",
  });

  const [deptDialog, setDeptDialog] = useState(false);
  const [deptForm, setDeptForm] = useState({ name: "", description: "", bonusEnabled: false, bonusPercent: 0, overtimeRate: 1.5 });
  const [editDept, setEditDept] = useState<any>(null);

  const [shiftDialog, setShiftDialog] = useState(false);
  const [shiftForm, setShiftForm] = useState({ name: "", startTime: "08:00", endTime: "17:00", breakMinutes: 60, workDays: "1,2,3,4,5" });

  const [leaveDialog, setLeaveDialog] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ name: "", color: "#3b82f6", maxDaysPerYear: 12, isPaid: true, requireApproval: true });

  const setComp = (k: string, v: any) => setCompanyForm(f => ({ ...f, [k]: v }));

  async function saveCompany(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/settings/company", {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(companyForm),
    });
    if (res.ok) { toast.success("Company settings saved!"); router.refresh(); }
    else toast.error("Failed to save");
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/settings/general", {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settingVals),
    });
    if (res.ok) { toast.success("Settings saved!"); }
    else toast.error("Failed to save settings");
  }

  async function saveDept(e: React.FormEvent) {
    e.preventDefault();
    const url = editDept ? `/api/departments/${editDept.id}` : "/api/departments";
    const method = editDept ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(deptForm) });
    if (res.ok) { toast.success(editDept ? "Department updated!" : "Department created!"); setDeptDialog(false); router.refresh(); }
    else toast.error("Failed");
  }

  async function deleteDept(id: string) {
    if (!confirm("Delete this department?")) return;
    await fetch(`/api/departments/${id}`, { method: "DELETE" });
    toast.success("Deleted"); router.refresh();
  }

  async function saveShift(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/shifts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(shiftForm) });
    if (res.ok) { toast.success("Shift created!"); setShiftDialog(false); router.refresh(); }
    else toast.error("Failed");
  }

  async function saveLeaveType(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/leave-types", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(leaveForm) });
    if (res.ok) { toast.success("Leave type created!"); setLeaveDialog(false); router.refresh(); }
    else toast.error("Failed");
  }

  const WORK_DAYS_OPTIONS = [
    { value: "1,2,3,4,5", label: "Mon–Fri" },
    { value: "1,2,3,4,5,6", label: "Mon–Sat" },
    { value: "0,1,2,3,4,5,6", label: "All Days" },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="text-slate-500 text-sm">Configure your company and system preferences</p>
      </div>

      <Tabs defaultValue="company">
        <TabsList>
          <TabsTrigger value="company"><Building2 className="w-3.5 h-3.5 mr-1.5" />Company</TabsTrigger>
          <TabsTrigger value="departments"><Briefcase className="w-3.5 h-3.5 mr-1.5" />Departments</TabsTrigger>
          <TabsTrigger value="shifts"><Clock className="w-3.5 h-3.5 mr-1.5" />Shifts</TabsTrigger>
          <TabsTrigger value="leave"><Calendar className="w-3.5 h-3.5 mr-1.5" />Leave Types</TabsTrigger>
          <TabsTrigger value="general"><Settings2 className="w-3.5 h-3.5 mr-1.5" />General</TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <form onSubmit={saveCompany} className="space-y-4 mt-4">
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="text-base">Company Information</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2"><Label>Company Name</Label><Input value={companyForm.name} onChange={e => setComp("name", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={companyForm.email} onChange={e => setComp("email", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Phone</Label><Input value={companyForm.phone} onChange={e => setComp("phone", e.target.value)} /></div>
                <div className="space-y-1.5 col-span-2"><Label>Address</Label><Input value={companyForm.address} onChange={e => setComp("address", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Tax ID</Label><Input value={companyForm.taxId} onChange={e => setComp("taxId", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Currency</Label>
                  <Select value={companyForm.currency} onValueChange={v => setComp("currency", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="THB">THB (Thai Baht)</SelectItem>
                      <SelectItem value="USD">USD (US Dollar)</SelectItem>
                      <SelectItem value="EUR">EUR (Euro)</SelectItem>
                      <SelectItem value="SGD">SGD (Singapore Dollar)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="text-base">Work Schedule</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Work Start Time</Label><Input type="time" value={companyForm.workStartTime} onChange={e => setComp("workStartTime", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Work End Time</Label><Input type="time" value={companyForm.workEndTime} onChange={e => setComp("workEndTime", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Late Grace Period (minutes)</Label><Input type="number" min={0} value={companyForm.lateGraceMinutes} onChange={e => setComp("lateGraceMinutes", Number(e.target.value))} /></div>
                <div className="space-y-1.5"><Label>Work Days</Label>
                  <Select value={companyForm.workDays} onValueChange={v => setComp("workDays", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{WORK_DAYS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-end"><Button type="submit" className="bg-blue-600 hover:bg-blue-700"><Save className="w-4 h-4 mr-2" />Save Company Settings</Button></div>
          </form>
        </TabsContent>

        <TabsContent value="departments">
          <div className="mt-4 space-y-4">
            <div className="flex justify-end">
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => { setEditDept(null); setDeptForm({ name: "", description: "", bonusEnabled: false, bonusPercent: 0, overtimeRate: 1.5 }); setDeptDialog(true); }}>
                <Plus className="w-4 h-4 mr-2" />Add Department
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {departments.map((d: any) => (
                <Card key={d.id} className="border-0 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-slate-800">{d.name}</p>
                        <p className="text-xs text-slate-400">{d._count?.employees ?? 0} employees</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                          setEditDept(d);
                          setDeptForm({ name: d.name, description: d.description || "", bonusEnabled: d.bonusEnabled, bonusPercent: d.bonusPercent, overtimeRate: d.overtimeRate });
                          setDeptDialog(true);
                        }}><Edit className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => deleteDept(d.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap text-xs">
                      {d.bonusEnabled && <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Bonus {d.bonusPercent}%</span>}
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">OT {d.overtimeRate}x</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Dialog open={deptDialog} onOpenChange={setDeptDialog}>
            <DialogContent>
              <DialogHeader><DialogTitle>{editDept ? "Edit" : "New"} Department</DialogTitle></DialogHeader>
              <form onSubmit={saveDept} className="space-y-4">
                <div className="space-y-1.5"><Label>Name</Label><Input required value={deptForm.name} onChange={e => setDeptForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div className="space-y-1.5"><Label>Description</Label><Input value={deptForm.description} onChange={e => setDeptForm(f => ({ ...f, description: e.target.value }))} /></div>
                <div className="space-y-1.5"><Label>Overtime Rate</Label><Input type="number" step="0.1" value={deptForm.overtimeRate} onChange={e => setDeptForm(f => ({ ...f, overtimeRate: Number(e.target.value) }))} /></div>
                <div className="flex items-center gap-3">
                  <Switch checked={deptForm.bonusEnabled} onCheckedChange={v => setDeptForm(f => ({ ...f, bonusEnabled: v }))} />
                  <Label>Enable Department Bonus</Label>
                </div>
                {deptForm.bonusEnabled && (
                  <div className="space-y-1.5"><Label>Bonus % of salary</Label><Input type="number" step="0.1" value={deptForm.bonusPercent} onChange={e => setDeptForm(f => ({ ...f, bonusPercent: Number(e.target.value) }))} /></div>
                )}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDeptDialog(false)}>Cancel</Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Save</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="shifts">
          <div className="mt-4 space-y-4">
            <div className="flex justify-end">
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShiftDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />Add Shift
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shifts.map((s: any) => (
                <Card key={s.id} className="border-0 shadow-sm">
                  <CardContent className="p-5">
                    <p className="font-semibold text-slate-800 mb-1">{s.name}</p>
                    <p className="text-sm text-slate-500">{s.startTime} – {s.endTime}</p>
                    <p className="text-xs text-slate-400">Break: {s.breakMinutes}min</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <Dialog open={shiftDialog} onOpenChange={setShiftDialog}>
            <DialogContent>
              <DialogHeader><DialogTitle>New Shift</DialogTitle></DialogHeader>
              <form onSubmit={saveShift} className="space-y-4">
                <div className="space-y-1.5"><Label>Shift Name</Label><Input required value={shiftForm.name} onChange={e => setShiftForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Start Time</Label><Input type="time" value={shiftForm.startTime} onChange={e => setShiftForm(f => ({ ...f, startTime: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label>End Time</Label><Input type="time" value={shiftForm.endTime} onChange={e => setShiftForm(f => ({ ...f, endTime: e.target.value }))} /></div>
                </div>
                <div className="space-y-1.5"><Label>Break (minutes)</Label><Input type="number" value={shiftForm.breakMinutes} onChange={e => setShiftForm(f => ({ ...f, breakMinutes: Number(e.target.value) }))} /></div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShiftDialog(false)}>Cancel</Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Create Shift</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="leave">
          <div className="mt-4 space-y-4">
            <div className="flex justify-end">
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setLeaveDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />Add Leave Type
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {leaveTypes.map((lt: any) => (
                <Card key={lt.id} className="border-0 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: lt.color }} />
                      <p className="font-semibold text-slate-800">{lt.name}</p>
                    </div>
                    <p className="text-sm text-slate-500">{lt.maxDaysPerYear} days/year</p>
                    <div className="flex gap-2 mt-2 text-xs">
                      <span className={`px-2 py-0.5 rounded-full ${lt.isPaid ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                        {lt.isPaid ? "Paid" : "Unpaid"}
                      </span>
                      {lt.requireApproval && <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Needs Approval</span>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <Dialog open={leaveDialog} onOpenChange={setLeaveDialog}>
            <DialogContent>
              <DialogHeader><DialogTitle>New Leave Type</DialogTitle></DialogHeader>
              <form onSubmit={saveLeaveType} className="space-y-4">
                <div className="space-y-1.5"><Label>Leave Type Name</Label><Input required value={leaveForm.name} onChange={e => setLeaveForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Color</Label><Input type="color" value={leaveForm.color} onChange={e => setLeaveForm(f => ({ ...f, color: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label>Max Days/Year</Label><Input type="number" value={leaveForm.maxDaysPerYear} onChange={e => setLeaveForm(f => ({ ...f, maxDaysPerYear: Number(e.target.value) }))} /></div>
                </div>
                <div className="flex items-center gap-3"><Switch checked={leaveForm.isPaid} onCheckedChange={v => setLeaveForm(f => ({ ...f, isPaid: v }))} /><Label>Paid Leave</Label></div>
                <div className="flex items-center gap-3"><Switch checked={leaveForm.requireApproval} onCheckedChange={v => setLeaveForm(f => ({ ...f, requireApproval: v }))} /><Label>Require Approval</Label></div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setLeaveDialog(false)}>Cancel</Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Create</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="general">
          <form onSubmit={saveSettings} className="mt-4 space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="text-base">Bonus & Incentive Settings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Perfect Attendance Bonus (THB)</Label>
                  <p className="text-xs text-slate-400">Amount added to salary when staff has zero late, absent, or leave days</p>
                  <Input type="number" value={settingVals.perfect_attendance_bonus}
                    onChange={e => setSettingVals(f => ({ ...f, perfect_attendance_bonus: e.target.value }))} />
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700"><Save className="w-4 h-4 mr-2" />Save Settings</Button>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
