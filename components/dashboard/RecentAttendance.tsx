import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatTime, getInitials } from "@/lib/utils";

const statusColor: Record<string, string> = {
  PRESENT: "bg-green-100 text-green-700",
  LATE: "bg-amber-100 text-amber-700",
  ABSENT: "bg-red-100 text-red-700",
  ON_LEAVE: "bg-blue-100 text-blue-700",
  OVERTIME: "bg-purple-100 text-purple-700",
  HALF_DAY: "bg-orange-100 text-orange-700",
};

export default function RecentAttendance({ data }: { data: any[] }) {
  if (!data.length) return <p className="text-center text-slate-400 text-sm py-8">No attendance records today</p>;
  return (
    <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
      {data.map((a) => {
        const name = `${a.employee.firstName} ${a.employee.lastName}`;
        return (
          <div key={a.id} className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-blue-600 text-white text-xs font-bold">
                  {getInitials(name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-slate-700">{name}</p>
                <p className="text-xs text-slate-400">
                  {a.checkIn ? formatTime(a.checkIn) : "--"}
                  {a.checkOut ? ` - ${formatTime(a.checkOut)}` : ""}
                </p>
              </div>
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor[a.status] ?? "bg-slate-100 text-slate-500"}`}>
              {a.status.replace("_", " ")}
            </span>
          </div>
        );
      })}
    </div>
  );
}
