"use client";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell, Area, AreaChart, LabelList,
} from "recharts";

// Token values (Recharts needs concrete colours).
export const C = {
  ink: "#2B1B1C",
  ink500: "#6B5B57",
  muted: "#857971",
  gold: "#E09E3E",
  gold700: "#B5761B",
  gold300: "#F3DFB4",
  hair: "#E9E0D4",
  panel: "#F6F1E9",
  up: "#157D1C",
  watch: "#DB7A1C",
  down: "#C0442E",
};
// A restrained multi-series palette (kept warm/earthy, not rainbow).
export const SERIES = [C.gold, C.ink, C.up, C.watch, C.down, C.gold700, C.ink500];

const axis = { stroke: C.hair, tick: { fill: C.ink500, fontSize: 12 }, tickLine: false };

function TooltipBox({ active, payload, label }: { active?: boolean; payload?: Array<{ name?: string; value?: number; color?: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-sm border border-hair bg-surface px-3 py-2 text-[12px] shadow-[var(--shadow-pop)]">
      <div className="mb-1 font-semibold text-ink-900">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 tabular">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-ink-500">{p.name}</span>
          <span className="ml-auto font-semibold text-ink-900">{typeof p.value === "number" ? p.value : "—"}</span>
        </div>
      ))}
    </div>
  );
}

type LineDef = { key: string; name: string; color?: string };

export function KVLineChart({
  data, xKey, lines, height = 260, area = false, yDomain = [0, 100],
}: {
  data: Record<string, unknown>[];
  xKey: string;
  lines: LineDef[];
  height?: number;
  area?: boolean;
  yDomain?: [number, number];
}) {
  const Chart = area ? AreaChart : LineChart;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <Chart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 4 }}>
        <CartesianGrid stroke={C.hair} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={xKey} {...axis} interval="preserveStartEnd" />
        <YAxis domain={yDomain} {...axis} width={40} />
        <Tooltip content={<TooltipBox />} cursor={{ stroke: C.gold300 }} />
        {lines.map((l, i) =>
          area ? (
            <Area key={l.key} type="monotone" dataKey={l.key} name={l.name}
              stroke={l.color ?? SERIES[i % SERIES.length]} fill={l.color ?? SERIES[i % SERIES.length]}
              fillOpacity={0.12} strokeWidth={2} dot={{ r: 2.5 }} activeDot={{ r: 4 }} />
          ) : (
            <Line key={l.key} type="monotone" dataKey={l.key} name={l.name}
              stroke={l.color ?? SERIES[i % SERIES.length]} strokeWidth={2}
              dot={{ r: 2.5, strokeWidth: 0, fill: l.color ?? SERIES[i % SERIES.length] }} activeDot={{ r: 4 }} />
          ),
        )}
      </Chart>
    </ResponsiveContainer>
  );
}

export function KVBarChart({
  data, xKey, valueKey, height = 260, horizontal = false, colorByBand = false, showValues = true, maxDomain = 100,
}: {
  data: Record<string, unknown>[];
  xKey: string;
  valueKey: string;
  height?: number;
  horizontal?: boolean;
  colorByBand?: boolean;
  showValues?: boolean;
  maxDomain?: number;
}) {
  const bandColor: Record<string, string> = { A1: C.up, A2: C.up, B1: C.gold, B2: C.gold, C1: C.watch, C2: C.watch, D: C.down, E: C.down };
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={horizontal ? "vertical" : "horizontal"} margin={{ top: 8, right: 16, left: horizontal ? 8 : -12, bottom: 4 }}>
        <CartesianGrid stroke={C.hair} strokeDasharray="3 3" horizontal={!horizontal} vertical={horizontal} />
        {horizontal ? (
          <>
            <XAxis type="number" domain={[0, maxDomain]} {...axis} />
            <YAxis type="category" dataKey={xKey} {...axis} width={96} />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} {...axis} />
            <YAxis domain={[0, maxDomain]} {...axis} width={40} />
          </>
        )}
        <Tooltip content={<TooltipBox />} cursor={{ fill: C.panel }} />
        <Bar dataKey={valueKey} radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]} maxBarSize={44}>
          {showValues && (
            <LabelList dataKey={valueKey} position={horizontal ? "right" : "top"} className="tabular"
              style={{ fill: C.ink500, fontSize: 11, fontWeight: 600 }} />
          )}
          {data.map((d, i) => (
            <Cell key={i} fill={colorByBand ? bandColor[String(d[xKey])] ?? C.gold : C.gold} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
