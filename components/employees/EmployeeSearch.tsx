"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Mail, Phone, Edit, Smartphone } from "lucide-react";
import { getInitials, formatCurrency } from "@/lib/utils";
import Link from "next/link";

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700 border-green-200",
  INACTIVE: "bg-slate-100 text-slate-600",
  TERMINATED: "bg-red-100 text-red-700",
};

const roleColors: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-700",
  HR: "bg-blue-100 text-blue-700",
  MANAGER: "bg-amber-100 text-amber-700",
  STAFF: "bg-slate-100 text-slate-600",
};

export default function EmployeeSearch({ employees }: { employees: any[] }) {
  const [search, setSearch] = useState("");
  const filtered = employees.filter((e) => {
    const q = search.toLowerCase();
    return (
      e.firstName.toLowerCase().includes(q) ||
      e.lastName.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      e.employeeCode.toLowerCase().includes(q) ||
      e.department?.name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search employees..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((emp) => {
          const name = `${emp.firstName} ${emp.lastName}`;
          return (
            <div key={emp.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-11 w-11">
                    {emp.avatar ? (
                      <img src={emp.avatar} alt={name} className="rounded-full object-cover" />
                    ) : (
                      <AvatarFallback className="bg-blue-600 text-white font-bold">
                        {getInitials(name)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="font-semibold text-slate-800">{name}</p>
                    <p className="text-xs text-slate-400">{emp.employeeCode}</p>
                  </div>
                </div>
                <Link href={`/employees/${emp.id}`}>
                  <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                </Link>
              </div>
              <div className="space-y-1.5 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <Mail className="w-3 h-3" />
                  <span className="truncate">{emp.email}</span>
                </div>
                {emp.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3" />
                    <span>{emp.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Smartphone className="w-3 h-3" />
                  <span>{emp.maxDevices === 0 ? "Unlimited devices" : `Max ${emp.maxDevices} device(s)`}</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex gap-1.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[emp.status]}`}>
                    {emp.status}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[emp.role]}`}>
                    {emp.role}
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-700">{formatCurrency(emp.baseSalary)}</span>
              </div>
              {emp.department && (
                <p className="text-xs text-slate-400 mt-1">{emp.department.name} · {emp.position || "—"}</p>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-3 text-center text-slate-400 py-12">No employees found</div>
        )}
      </div>
    </div>
  );
}
