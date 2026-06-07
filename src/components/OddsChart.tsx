"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function OddsChart({ data, bookmakers }: { data: Record<string, string | number>[]; bookmakers: string[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 18, bottom: 10, left: 0 }}>
          <XAxis
            dataKey="time"
            stroke="#7d8796"
            tickFormatter={(value) => new Date(String(value)).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          />
          <YAxis domain={["dataMin - 0.1", "dataMax + 0.1"]} stroke="#7d8796" />
          <Tooltip contentStyle={{ background: "#11151d", border: "1px solid #263142", color: "#e8edf5" }} />
          {bookmakers.map((bookmaker, index) => (
            <Line key={bookmaker} type="monotone" dataKey={bookmaker} dot={false} stroke={["#22c55e", "#facc15", "#38bdf8", "#ef4444"][index % 4]} strokeWidth={2} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
