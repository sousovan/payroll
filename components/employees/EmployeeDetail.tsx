"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Save, Monitor, Trash2, RefreshCw, QrCode } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { formatCurrency, getInitials, formatDate } from "@/lib/utils";

export default function EmployeeDetail({ employee, departments, shifts }: { employee: any; departments: any[]; shifts: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    phone: employee.phone || "",
    position: employee.position || "",
    departmentId: employee.departmentId || "",
    role: employee.role,
    status: employee.status,
    baseSalary: employee.baseSalary,
    salaryType: employee.salaryType,
    workHoursPerMonth: employee.workHoursPerMonth,
    maxDevices: employee.maxDevices,
    leaveDaysPerYear: employee.leaveDaysPerYear,
    password: "",
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const name = `${employee.firstName} ${employee.lastName}`;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const body: any = { ...form, baseSalary: Number(form.baseSalary), maxDevices: Number(form.maxDevices) };
      if (!body.password) delete body.password;
      const res = await fetch(`/api/employees/${employee.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Update failed");
      toast.success("Employee updated!");
      router.refresh();
    } catch {
      toast.error("Failed to update employee");
    } finally {
      setLoading(false);
    }
  }

  async function revokeDevice(deviceId?: string) {
    await fetch(`/api/employees/${employee.id}/devices`, {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId }),
    });
    toast.success("Device session revoked");
    router.refresh();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/employees"><Button variant="outline" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-blue-600 text-white text-lg font-bold">{getInitials(name)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{name}</h1>
            <p className="text-slate-500 text-sm">{employee.employeeCode} · {employee.position || "No position"}</p>
          </div>
        </div>
      </div>
      <Tabs defaultValue="profile">
        <TabsList className="mb-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="devices">Devices ({employee.deviceSessions.length})</TabsTrigger>
          <TabsTrigger value="qr">QR Code</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <form onSubmit={handleSave} className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="text-base">Personal &amp; Employment</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>First Name</Label><Input value={form.firstName} onChange={e => set("firstName", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Last Name</Label><Input value={form.lastName} onChange={e => set("lastName", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={e => set("email", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={e => set("phone", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>New Password (leave blank to keep)</Label><Input type="password" value={form.password} onChange={e => set("password", e.target.value)} /></div>
                <div className="space-y-1.5">
                  <Label>Department</Label>
                  <Select value={form.departmentId} onValueChange={v => set("departmentId", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>Position</Label><Input value={form.position} onChange={e => set("position", e.target.value)} /></div>
                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <Select value={form.role} onValueChange={v => set("role", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STAFF">Staff</SelectItem>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => set("status", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                      <SelectItem value="TERMINATED">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="text-base">Salary &amp; Settings</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5"><Label>Base Salary (THB)</Label><Input type="number" value={form.baseSalary} onChange={e => set("baseSalary", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Work Hours/Month</Label><Input type="number" value={form.workHoursPerMonth} onChange={e => set("workHoursPerMonth", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Leave Days/Year</Label><Input type="number" value={form.leaveDaysPerYear} onChange={e => set("leaveDaysPerYear", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Max Devices (0=unlimited)</Label><Input type="number" min={0} value={form.maxDevices} onChange={e => set("maxDevices", e.target.value)} /></div>
                <div className="space-y-1.5">
                  <Label>Salary Type</Label>
                  <Select value={form.salaryType} onValueChange={v => set("salaryType", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="DAILY">Daily</SelectItem>
                      <SelectItem value="HOURLY">Hourly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </TabsContent>
        <TabsContent value="devices">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Device Sessions</CardTitle>
              <Button variant="outline" size="sm" onClick={() => revokeDevice(undefined)}>
                <Trash2 className="w-3 h-3 mr-1.5" />Revoke All
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-400 mb-4">
                Max allowed: {employee.maxDevices === 0 ? "Unlimited" : employee.maxDevices}
              </p>
              {employee.deviceSessions.length === 0 ? (
                <p className="text-slate-400 text-sm">No device sessions</p>
              ) : (
                <div className="space-y-3">
                  {employee.deviceSessions.map((d: any) => (
                    <div key={d.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Monitor className="w-4 h-4 text-slate-500" />
                        <div>
                          <p className="text-sm font-medium">{d.deviceName || "Unknown Device"}</p>
                          <p className="text-xs text-slate-400">{d.ip} · Last seen {formatDate(d.lastSeen)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${d.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                          {d.isActive ? "Active" : "Inactive"}
                        </span>
                        <Button variant="ghost" size="icon" onClick={() => revokeDevice(d.deviceId)} className="h-7 w-7">
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="qr">
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-base">Employee QR Code</CardTitle></CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="flex justify-center">
                <img
                  src={`/api/employees/${employee.id}/qr`}
                  alt="QR Code"
                  className="w-48 h-48 border rounded-xl"
                />
              </div>
              <p className="text-sm text-slate-500">Use this QR code for attendance check-in/out</p>
              <a href={`/api/employees/${employee.id}/qr`} download={`qr-${employee.employeeCode}.png`} className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                <QrCode className="w-4 h-4 mr-2" />Download QR
              </a>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
