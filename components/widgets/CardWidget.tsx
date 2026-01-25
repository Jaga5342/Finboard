"use client";

import { useEffect, useMemo, useState, memo } from "react";
import WidgetContainer from "./WidgetContainer";
import { Widget } from "@/types/widget";
import { FieldType } from "@/types/api";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercentage,
  truncateText,
} from "@/utils/formatters";
import { useAutoRefresh } from "@/utils/useAutoRefresh";

interface CardWidgetProps {
  widget: Widget;
  data: unknown;
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onConfigure?: () => void;
  onDelete?: () => void;
}

type RecordLike = Record<string, unknown>;

function getValueAtPath(data: unknown, path: string): unknown {
  if (!path) return data;
  const normalizedPath = path.replace(/\[(\d+)\]/g, ".$1");
  const segments = normalizedPath.split(".").filter(Boolean);
  let current: unknown = data;

  for (const segment of segments) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== "object") return undefined;

    const record = current as RecordLike;
    const index = Number(segment);

    if (Array.isArray(current) && !Number.isNaN(index)) {
      current = current[index];
      continue;
    }

    current = record[segment];
  }

  return current;
}

function formatFieldValue(fieldType: FieldType, value: unknown, fieldName: string): string {
  if (value === null || value === undefined) return "—";

  if (fieldType === FieldType.BOOLEAN) {
    return value ? "Yes" : "No";
  }

  if (fieldType === FieldType.DATE) {
    return formatDate(String(value));
  }

  if (fieldType === FieldType.NUMBER) {
    const numericValue = typeof value === "number" ? value : Number(value);
    if (Number.isNaN(numericValue)) return "—";

    const lowerName = fieldName.toLowerCase();
    if (lowerName.includes("percent") || lowerName.includes("percentage")) {
      return formatPercentage(numericValue / 100);
    }
    if (
      lowerName.includes("price") ||
      lowerName.includes("amount") ||
      lowerName.includes("total") ||
      lowerName.includes("usd")
    ) {
      return formatCurrency(numericValue);
    }

    return formatNumber(numericValue, 2);
  }

  if (fieldType === FieldType.ARRAY || fieldType === FieldType.OBJECT) {
    try {
      return truncateText(JSON.stringify(value), 80);
    } catch {
      return "—";
    }
  }

  return truncateText(String(value), 80);
}

function CardWidget({
  widget,
  data,
  isLoading = false,
  error,
  onRefresh,
  onConfigure,
  onDelete,
}: CardWidgetProps) {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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

  const LoadingSkeleton = (
    <div className="flex h-full flex-col justify-between gap-6">
      <div className="space-y-4">
        <div className="h-3 w-24 animate-pulse rounded bg-zinc-800" />
        <div className="h-10 w-48 animate-pulse rounded bg-zinc-800" />
      </div>
      <div className="grid gap-3 border-t border-zinc-800/60 pt-4 sm:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="h-3 w-16 animate-pulse rounded bg-zinc-800" />
            <div className="h-5 w-24 animate-pulse rounded bg-zinc-800" />
          </div>
        ))}
      </div>
    </div>
  );

  const resolvedData = useMemo(() => {
    if (Array.isArray(data)) {
      return data[0] ?? null;
    }
    return data;
  }, [data]);

  const fields = widget.selectedFields ?? [];
  const [primaryField, ...secondaryFields] = fields;

  const primaryValue = primaryField
    ? formatFieldValue(
      primaryField.type,
      getValueAtPath(resolvedData, primaryField.path),
      primaryField.name
    )
    : null;

  const hasData =
    resolvedData !== null &&
    resolvedData !== undefined &&
    fields.length > 0 &&
    primaryValue !== null;

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
      {!hasData ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-zinc-800/70 bg-zinc-900/40 p-6 text-center">
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-300">No data available</p>
            <p className="text-xs text-zinc-500">
              Configure the widget settings or try refreshing.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex h-full flex-col justify-between gap-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              {primaryField.displayName}
            </p>
            <p className="text-3xl font-semibold text-zinc-100">
              {primaryValue}
            </p>
          </div>
          {secondaryFields.length > 0 ? (
            <div className="grid gap-3 border-t border-zinc-800/60 pt-4 sm:grid-cols-2">
              {secondaryFields.map((field) => {
                const value = formatFieldValue(
                  field.type,
                  getValueAtPath(resolvedData, field.path),
                  field.name
                );

                return (
                  <div key={field.path} className="flex flex-col gap-1">
                    <span className="text-xs text-zinc-500">
                      {field.displayName}
                    </span>
                    <span className="text-sm font-medium text-zinc-200">
                      {value}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      )}
    </WidgetContainer>
  );
}

export default memo(CardWidget);
