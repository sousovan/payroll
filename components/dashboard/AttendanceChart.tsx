"use client";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function AttendanceChart({ month, year }: { month: number; year: number }) {
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    fetch(`/api/reports/attendance-chart?month=${month}&year=${year}`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, [month, year]);

  if (!data.length) return <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Loading chart...</div>;

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="week" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="present" fill="#3b82f6" radius={[4,4,0,0]} name="Present" />
          <Bar dataKey="absent" fill="#ef4444" radius={[4,4,0,0]} name="Absent" />
          <Bar dataKey="late" fill="#f59e0b" radius={[4,4,0,0]} name="Late" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
