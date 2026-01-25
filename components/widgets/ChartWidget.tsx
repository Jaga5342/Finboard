"use client";

import { useEffect, useMemo, useState, useId, memo } from "react";
import WidgetContainer from "./WidgetContainer";
import { Widget } from "@/types/widget";
import { formatCurrency, formatNumber } from "@/utils/formatters";
import { useAutoRefresh } from "@/utils/useAutoRefresh";
// Lazy load recharts to improve initial bundle size
import dynamic from 'next/dynamic';

const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const LineChart = dynamic(() => import('recharts').then(mod => mod.LineChart), { ssr: false });
const ComposedChart = dynamic(() => import('recharts').then(mod => mod.ComposedChart), { ssr: false });
const Line = dynamic(() => import('recharts').then(mod => mod.Line), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const Label = dynamic(() => import('recharts').then(mod => mod.Label), { ssr: false });
const Customized = dynamic(() => import('recharts').then(mod => mod.Customized as any), { ssr: false }) as any;

type ChartType = "line" | "candlestick";
type TimeInterval = "daily" | "weekly" | "monthly";

interface ChartWidgetProps {
  widget: Widget;
  data: unknown;
  chartType: ChartType;
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onConfigure?: () => void;
  onDelete?: () => void;
}

interface ChartPoint {
  time: number;
  label: string;
  value: number;
  open?: number;
  close?: number;
  high?: number;
  low?: number;
}

type RecordLike = Record<string, unknown>;

const INTERVALS: Array<{ label: string; value: TimeInterval }> = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
];

const timeKeys = [
  "time",
  "timestamp",
  "date",
  "datetime",
  "createdAt",
  "updatedAt",
];

function parseTime(value: unknown): number | null {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return parsed;
    const numeric = Number(value);
    if (!Number.isNaN(numeric)) return numeric;
  }
  return null;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

function resolveArray(data: unknown): RecordLike[] {
  if (Array.isArray(data)) return data as RecordLike[];
  if (data && typeof data === "object") {
    const record = data as RecordLike;
    const candidates = [
      record.data,
      record.items,
      record.results,
      record.prices,
      record.values,
    ];
    for (const candidate of candidates) {
      if (Array.isArray(candidate)) return candidate as RecordLike[];
    }
  }
  return [];
}

function getTimeValue(point: RecordLike): number | null {
  for (const key of timeKeys) {
    if (point[key] !== undefined) {
      const parsed = parseTime(point[key]);
      if (parsed !== null) return parsed;
    }
  }
  return null;
}

function getPrimaryValue(point: RecordLike): number | null {
  const valueKeys = ["value", "price", "close", "amount", "y"];
  for (const key of valueKeys) {
    if (point[key] !== undefined) {
      const parsed = toNumber(point[key]);
      if (parsed !== null) return parsed;
    }
  }
  return null;
}

function getCandleValues(point: RecordLike) {
  const open = toNumber(point.open ?? point.o);
  const close = toNumber(point.close ?? point.c);
  const high = toNumber(point.high ?? point.h);
  const low = toNumber(point.low ?? point.l);
  return { open, close, high, low };
}

function formatTick(value: number, interval: TimeInterval): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  switch (interval) {
    case "weekly":
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "2-digit",
      }).format(date);
    case "monthly":
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        year: "2-digit",
      }).format(date);
    default:
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "2-digit",
      }).format(date);
  }
}

function bucketKey(date: Date, interval: TimeInterval): string {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  if (interval === "monthly") {
    return `${year}-${String(month + 1).padStart(2, "0")}`;
  }

  if (interval === "weekly") {
    const working = new Date(date);
    const dayIndex = (working.getDay() + 6) % 7; // Monday = 0
    working.setDate(working.getDate() - dayIndex);
    return `${working.getFullYear()}-${String(
      working.getMonth() + 1
    ).padStart(2, "0")}-${String(working.getDate()).padStart(2, "0")}`;
  }

  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(
    2,
    "0"
  )}`;
}

function buildChartData(
  data: unknown,
  interval: TimeInterval,
  chartType: ChartType
): ChartPoint[] {
  const rows = resolveArray(data);
  const points: ChartPoint[] = [];

  rows.forEach((row, index) => {
    const time = getTimeValue(row) ?? Date.now() + index;
    const date = new Date(time);
    const label = formatTick(time, interval);
    const primaryValue = getPrimaryValue(row);

    const candleValues = getCandleValues(row);

    points.push({
      time: date.getTime(),
      label,
      value: primaryValue ?? candleValues.close ?? 0,
      open: candleValues.open ?? undefined,
      close: candleValues.close ?? undefined,
      high: candleValues.high ?? undefined,
      low: candleValues.low ?? undefined,
    });
  });

  const sorted = points.sort((a, b) => a.time - b.time);
  const grouped = new Map<string, ChartPoint>();

  sorted.forEach((point) => {
    const key = bucketKey(new Date(point.time), interval);
    grouped.set(key, point);
  });

  const aggregated = Array.from(grouped.values()).sort(
    (a, b) => a.time - b.time
  );

  if (chartType === "candlestick") {
    return aggregated.filter(
      (point) =>
        typeof point.open === "number" &&
        typeof point.close === "number" &&
        typeof point.high === "number" &&
        typeof point.low === "number"
    );
  }

  return aggregated.filter((point) => Number.isFinite(point.value));
}

function TooltipContent({
  active,
  payload,
  label,
  chartType,
  valueLabel,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartPoint }>;
  label?: string;
  chartType: ChartType;
  valueLabel: string;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;

  return (
    <div className="rounded-lg border border-zinc-700/70 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 shadow-lg">
      <div className="text-zinc-400">{label ?? point.label}</div>
      {chartType === "candlestick" ? (
        <div className="mt-1 grid gap-1">
          <span>Open: {formatNumber(point.open ?? 0, 2)}</span>
          <span>High: {formatNumber(point.high ?? 0, 2)}</span>
          <span>Low: {formatNumber(point.low ?? 0, 2)}</span>
          <span>Close: {formatNumber(point.close ?? 0, 2)}</span>
        </div>
      ) : (
        <div className="mt-1 text-sm font-semibold text-zinc-100">
          {valueLabel}: {formatCurrency(point.value)}
        </div>
      )}
    </div>
  );
}

function CandleSeries({
  data,
  xAxisMap,
  yAxisMap,
}: {
  data: ChartPoint[];
  xAxisMap?: Record<string, { scale?: (value: string) => number; bandWidth?: number }>;
  yAxisMap?: Record<string, { scale?: (value: number) => number }>;
}) {
  const xAxis = xAxisMap ? Object.values(xAxisMap)[0] : undefined;
  const yAxis = yAxisMap ? Object.values(yAxisMap)[0] : undefined;
  const xScale = xAxis?.scale;
  const yScale = yAxis?.scale;

  if (!xScale || !yScale) return null;

  const bandWidth =
    xAxis?.bandWidth ?? (typeof (xScale as any).bandwidth === "function"
      ? (xScale as any).bandwidth()
      : 10);
  const candleWidth = Math.max(6, Math.min(14, bandWidth * 0.6));

  return (
    <g>
      {data.map((point) => {
        const x = xScale(point.label);
        if (typeof x !== "number") return null;

        const open = point.open ?? point.value;
        const close = point.close ?? point.value;
        const high = point.high ?? Math.max(open, close);
        const low = point.low ?? Math.min(open, close);

        const openY = yScale(open);
        const closeY = yScale(close);
        const highY = yScale(high);
        const lowY = yScale(low);

        if (
          [openY, closeY, highY, lowY].some(
            (val) => typeof val !== "number" || Number.isNaN(val)
          )
        ) {
          return null;
        }

        const isUp = close >= open;
        const color = isUp ? "#22c55e" : "#ef4444";
        const bodyY = Math.min(openY, closeY);
        const bodyHeight = Math.max(1, Math.abs(openY - closeY));
        const xCenter = x + bandWidth / 2;

        return (
          <g key={`${point.label}-${point.time}`}>
            <line
              x1={xCenter}
              x2={xCenter}
              y1={highY}
              y2={lowY}
              stroke={color}
              strokeWidth={1}
            />
            <rect
              x={xCenter - candleWidth / 2}
              y={bodyY}
              width={candleWidth}
              height={bodyHeight}
              fill={color}
              rx={1}
            />
          </g>
        );
      })}
    </g>
  );
}

function ChartWidget({
  widget,
  data,
  chartType,
  isLoading = false,
  error,
  onRefresh,
  onConfigure,
  onDelete,
}: ChartWidgetProps) {
  const [interval, setInterval] = useState<TimeInterval>("daily");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const gradientId = useId();

  useAutoRefresh(
    onRefresh ?? (() => { }),
    widget.refreshInterval ?? 0,
    !isLoading && !!onRefresh
  );

  useEffect(() => {
    if (data !== undefined) {
      setLastUpdated(new Date());
    }
  }, [data]);

  const chartData = useMemo(
    () => buildChartData(data, interval, chartType),
    [data, interval, chartType]
  );

  const LoadingSkeleton = (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-7 w-16 animate-pulse rounded-md bg-zinc-800" />
          ))}
        </div>
        <div className="h-4 w-20 animate-pulse rounded bg-zinc-800" />
      </div>
      <div className="flex-1 rounded-lg border border-zinc-800/60 bg-zinc-950/60 p-4">
        <div className="flex h-full items-end gap-2">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="flex-1 animate-pulse rounded-t bg-zinc-800/60"
              style={{
                height: `${Math.random() * 60 + 20}%`,
                animationDelay: `${i * 0.05}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );

  const valueLabel =
    widget.selectedFields?.[0]?.displayName ||
    widget.selectedFields?.[0]?.name ||
    "Value";

  return (
    <WidgetContainer
      name={widget.name}
      refreshInterval={widget.refreshInterval}
      lastUpdated={lastUpdated}
      isLoading={isLoading}
      loadingContent={LoadingSkeleton}
      error={error ?? undefined}
      onRefresh={onRefresh}
      onSettings={onConfigure}
      onDelete={onDelete}
    >
      <div className="flex h-full flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center rounded-lg border border-zinc-800/70 bg-zinc-900/60 p-1 text-xs text-zinc-400">
            {INTERVALS.map((option) => {
              const isActive = option.value === interval;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setInterval(option.value)}
                  className={[
                    "rounded-md px-3 py-1.5 transition-colors",
                    isActive
                      ? "bg-zinc-800 text-zinc-100"
                      : "text-zinc-400 hover:text-zinc-200",
                  ].join(" ")}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <span className="text-xs uppercase tracking-wide text-zinc-500">
            {chartType === "candlestick" ? "Candlestick" : "Line"}
          </span>
        </div>

        <div className="flex-1 rounded-lg border border-zinc-800/60 bg-zinc-950/60 p-3">
          {chartData.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <div className="rounded-full bg-zinc-800/50 p-3 text-zinc-400">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                  />
                </svg>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-zinc-300">
                  No chart data available
                </p>
                <p className="text-xs text-zinc-500">
                  Waiting for data points to visualize.
                </p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "candlestick" ? (
                <ComposedChart data={chartData}>
                  <CartesianGrid stroke="#27272a" strokeDasharray="4 4" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#a1a1aa", fontSize: 11 }}
                    axisLine={{ stroke: "#3f3f46" }}
                    tickLine={{ stroke: "#3f3f46" }}
                  >
                    <Label
                      value="Time"
                      position="insideBottom"
                      offset={-8}
                      fill="#a1a1aa"
                      fontSize={11}
                    />
                  </XAxis>
                  <YAxis
                    tick={{ fill: "#a1a1aa", fontSize: 11 }}
                    axisLine={{ stroke: "#3f3f46" }}
                    tickLine={{ stroke: "#3f3f46" }}
                    width={50}
                  >
                    <Label
                      value={valueLabel}
                      position="insideLeft"
                      angle={-90}
                      fill="#a1a1aa"
                      fontSize={11}
                    />
                  </YAxis>
                  <Tooltip
                    content={
                      <TooltipContent
                        chartType={chartType}
                        valueLabel={valueLabel}
                      />
                    }
                    cursor={{ stroke: "#3f3f46", strokeDasharray: "4 4" }}
                  />
                  <Customized component={(props: any) => <CandleSeries {...props} data={chartData} />} />
                </ComposedChart>
              ) : (
                <LineChart data={chartData}>
                  <defs>
                    <linearGradient
                      id={`lineGradient-${gradientId}`}
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                    >
                      <stop offset="0%" stopColor="#22d3ee" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#27272a" strokeDasharray="4 4" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#a1a1aa", fontSize: 11 }}
                    axisLine={{ stroke: "#3f3f46" }}
                    tickLine={{ stroke: "#3f3f46" }}
                  >
                    <Label
                      value="Time"
                      position="insideBottom"
                      offset={-8}
                      fill="#a1a1aa"
                      fontSize={11}
                    />
                  </XAxis>
                  <YAxis
                    tick={{ fill: "#a1a1aa", fontSize: 11 }}
                    axisLine={{ stroke: "#3f3f46" }}
                    tickLine={{ stroke: "#3f3f46" }}
                    width={50}
                  >
                    <Label
                      value={valueLabel}
                      position="insideLeft"
                      angle={-90}
                      fill="#a1a1aa"
                      fontSize={11}
                    />
                  </YAxis>
                  <Tooltip
                    content={
                      <TooltipContent
                        chartType={chartType}
                        valueLabel={valueLabel}
                      />
                    }
                    cursor={{ stroke: "#3f3f46", strokeDasharray: "4 4" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={`url(#lineGradient-${gradientId})`}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: "#22d3ee" }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </WidgetContainer>
  );
}

export default memo(ChartWidget);
