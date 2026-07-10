"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { ChartDataPoint } from "@/lib/admin/types";

const COLORS = ["#FF6B00", "#E63946", "#2ECC71", "#3498DB", "#9B59B6", "#F39C12", "#1ABC9C", "#E74C3C"];

interface ChartCardProps {
  title: string;
  data: ChartDataPoint[];
  type?: "area" | "bar" | "pie";
  valuePrefix?: string;
}

export function ChartCard({ title, data, type = "area", valuePrefix = "" }: ChartCardProps) {
  const formatValue = (v: unknown) => {
    const n = typeof v === "number" ? v : 0;
    return valuePrefix === "₹" ? `₹${n.toLocaleString("en-IN")}` : n.toLocaleString("en-IN");
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
      <h3 className="mb-4 text-sm font-semibold text-ink">{title}</h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          {type === "pie" ? (
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(props) => {
                  const name = String(props.name ?? "");
                  const pct = props.percent ?? 0;
                  return `${name} ${(pct * 100).toFixed(0)}%`;
                }}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => formatValue(v)} />
            </PieChart>
          ) : type === "bar" ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => formatValue(v)} />
              <Bar dataKey="value" fill="#FF6B00" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#FF6B00" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => formatValue(v)} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#FF6B00"
                strokeWidth={2}
                fill="url(#colorValue)"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
