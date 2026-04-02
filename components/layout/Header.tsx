import { Session } from "next-auth";
import { Bell } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

export default function Header({ session }: { session: Session }) {
  const name = session.user?.name ?? "User";
  const role = (session.user as any)?.role ?? "STAFF";
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
      <div>
        <p className="text-xs text-slate-500">
          {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
          <Bell className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 bg-blue-600">
            <AvatarFallback className="bg-blue-600 text-white text-xs font-bold">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-slate-800">{name}</p>
            <p className="text-xs text-slate-500 capitalize">{role.toLowerCase()}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
