"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function NewEmployeePage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    employeeCode: "", firstName: "", lastName: "", email: "", phone: "",
    password: "changeme123", departmentId: "", position: "", role: "STAFF",
    status: "ACTIVE", joinDate: new Date().toISOString().split("T")[0],
    baseSalary: 20000, salaryType: "MONTHLY", workHoursPerMonth: 192,
    maxDevices: 1, leaveDaysPerYear: 12,
  });

  useEffect(() => {
    fetch("/api/departments").then(r => r.json()).then(setDepartments);
  }, []);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, baseSalary: Number(form.baseSalary), maxDevices: Number(form.maxDevices), leaveDaysPerYear: Number(form.leaveDaysPerYear), workHoursPerMonth: Number(form.workHoursPerMonth) }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Employee created successfully!");
      router.push("/employees");
    } catch (err: any) {
      toast.error(err.message || "Failed to create employee");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/employees">
          <Button variant="outline" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">New Employee</h1>
          <p className="text-slate-500 text-sm">Add a new staff member</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Employee Code *</Label><Input required value={form.employeeCode} onChange={e => set("employeeCode", e.target.value)} placeholder="EMP001" /></div>
            <div className="space-y-1.5"><Label>First Name *</Label><Input required value={form.firstName} onChange={e => set("firstName", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Last Name *</Label><Input required value={form.lastName} onChange={e => set("lastName", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Email *</Label><Input required type="email" value={form.email} onChange={e => set("email", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={e => set("phone", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Password</Label><Input type="password" value={form.password} onChange={e => set("password", e.target.value)} /></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Employment Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select value={form.departmentId} onValueChange={v => set("departmentId", v)}>
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
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
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Join Date *</Label><Input required type="date" value={form.joinDate} onChange={e => set("joinDate", e.target.value)} /></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Salary &amp; Work Settings</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Base Salary (THB)</Label><Input type="number" value={form.baseSalary} onChange={e => set("baseSalary", e.target.value)} /></div>
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
            <div className="space-y-1.5"><Label>Work Hours/Month</Label><Input type="number" value={form.workHoursPerMonth} onChange={e => set("workHoursPerMonth", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Leave Days/Year</Label><Input type="number" value={form.leaveDaysPerYear} onChange={e => set("leaveDaysPerYear", e.target.value)} /></div>
            <div className="space-y-1.5">
              <Label>Max Devices (0 = unlimited)</Label>
              <Input type="number" min={0} value={form.maxDevices} onChange={e => set("maxDevices", e.target.value)} />
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end">
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Creating..." : "Create Employee"}
          </Button>
        </div>
      </form>
    </div>
  );
}
