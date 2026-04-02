import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { getInitials, formatCurrency } from "@/lib/utils";
import EmployeeSearch from "@/components/employees/EmployeeSearch";

export default async function EmployeesPage() {
  const employees = await prisma.employee.findMany({
    include: { department: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Employees</h1>
          <p className="text-slate-500 text-sm mt-1">{employees.length} total employees</p>
        </div>
        <Link href="/employees/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        </Link>
      </div>

      <EmployeeSearch employees={employees} />
    </div>
  );
}
