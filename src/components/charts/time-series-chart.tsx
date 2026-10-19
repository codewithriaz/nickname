"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { dayjs } from "@/lib/dayjs";
import { compactNumber } from "@/lib/utils";
import { AXIS_TEXT, GRID, SERIES, SINGLE } from "./palette";

type Series<T> = { key: keyof T & string; label: string };

/**
 * Line/area over time: 2px lines, ~10% wash, one y-axis, crosshair tooltip,
 * legend for ≥2 series, plus an accessible table view.
 */
export function TimeSeriesChart<T extends { date: string }>({ data, series, height = 260 }: { data: T[]; series: Series<T>[]; height?: number }) {
  const colors = series.length === 1 ? [SINGLE] : SERIES;
  return (
    <div>
      {series.length > 1 && (
        <div className="mb-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
          {series.map((s, i) => (
            <span key={s.key} className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded-full" style={{ background: colors[i] }} />
              {s.label}
            </span>
          ))}
        </div>
      )}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <defs>
              {series.map((s, i) => (
                <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors[i]} stopOpacity={0.12} />
                  <stop offset="100%" stopColor={colors[i]} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis
              dataKey="date"
              tickFormatter={(d: string) => dayjs(d).format("D MMM")}
              tick={{ fontSize: 11, fill: AXIS_TEXT }}
              axisLine={false}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis allowDecimals={false} tickFormatter={(v: number) => compactNumber(v)} tick={{ fontSize: 11, fill: AXIS_TEXT }} axisLine={false} tickLine={false} width={44} />
            <Tooltip
              cursor={{ stroke: "#c4c1d4", strokeWidth: 1 }}
              contentStyle={{ borderRadius: 12, border: "1px solid #e9e7f2", fontSize: 12, boxShadow: "0 8px 24px -8px rgba(0,0,0,.15)" }}
              labelFormatter={(d) => dayjs(String(d)).format("ddd, D MMM YYYY")}
            />
            {series.map((s, i) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key as string}
                name={s.label}
                stroke={colors[i]}
                strokeWidth={2}
                fill={`url(#fill-${s.key})`}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
                dot={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <details className="mt-2 text-xs text-muted-foreground">
        <summary className="cursor-pointer select-none">View as table</summary>
        <div className="mt-2 max-h-56 overflow-y-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="py-1 font-medium">Date</th>
                {series.map((s) => (
                  <th key={s.key} className="py-1 text-right font-medium">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.date} className="border-t border-border">
                  <td className="py-1">{dayjs(row.date).format("D MMM YYYY")}</td>
                  {series.map((s) => (
                    <td key={s.key} className="py-1 text-right tabular-nums text-foreground">
                      {String(row[s.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
