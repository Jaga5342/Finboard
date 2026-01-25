"use client";

import { useEffect, useMemo, useState, memo } from "react";
import WidgetContainer from "./WidgetContainer";
import { Widget } from "@/types/widget";
import { FieldType } from "@/types/api";
import { formatDate, formatNumber, truncateText } from "@/utils/formatters";
import { useAutoRefresh } from "@/utils/useAutoRefresh";

interface TableWidgetProps {
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

function formatFieldValue(fieldType: FieldType, value: unknown): string {
  if (value === null || value === undefined) return "—";

  switch (fieldType) {
    case FieldType.NUMBER: {
      const numericValue = typeof value === "number" ? value : Number(value);
      return Number.isNaN(numericValue) ? "—" : formatNumber(numericValue, 2);
    }
    case FieldType.BOOLEAN:
      return value ? "Yes" : "No";
    case FieldType.DATE:
      return formatDate(String(value));
    case FieldType.ARRAY:
    case FieldType.OBJECT:
      return truncateText(JSON.stringify(value), 60);
    default:
      return truncateText(String(value), 60);
  }
}

function resolveRows(data: unknown): RecordLike[] {
  if (Array.isArray(data)) return data as RecordLike[];
  if (data && typeof data === "object") {
    const record = data as RecordLike;
    const candidates = [record.data, record.items, record.results, record.values];
    for (const candidate of candidates) {
      if (Array.isArray(candidate)) return candidate as RecordLike[];
    }
  }
  return [];
}

function TableWidget({
  widget,
  data,
  isLoading = false,
  error,
  onRefresh,
  onConfigure,
  onDelete,
}: TableWidgetProps) {
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
    <div className="h-full overflow-hidden rounded-lg border border-zinc-800/60">
      <div className="border-b border-zinc-800/70 bg-zinc-950/90 px-3 py-2">
        <div className="flex gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 w-24 animate-pulse rounded bg-zinc-800" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-zinc-900/60">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-4 px-3 py-3">
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-3 w-20 animate-pulse rounded bg-zinc-800/60" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const rows = useMemo(() => resolveRows(data), [data]);
  const fields = widget.selectedFields ?? [];

  const filteredRows = useMemo(() => {
    if (!debouncedSearch) return rows;
    const lower = debouncedSearch.toLowerCase();
    return rows.filter((row) =>
      fields.some((field) => {
        const val = getValueAtPath(row, field.path);
        return String(val).toLowerCase().includes(lower);
      })
    );
  }, [rows, debouncedSearch, fields]);

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
      <div className="flex flex-col h-full gap-2">
        {rows.length > 0 && fields.length > 0 && (
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded bg-zinc-900 border border-zinc-800 px-3 py-1 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
          />
        )}

        {filteredRows.length === 0 || fields.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-zinc-800/70 bg-zinc-900/40 p-6 text-center text-sm text-zinc-400">
            {/* ... Existing Empty State ... */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-300">No rows found</p>
              <p className="text-xs text-zinc-500">
                {rows.length > 0 ? "Try adjusting your search query." : "Try adjusting your query or refreshing the data."}
              </p>
            </div>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-zinc-800/60">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="sticky top-0 bg-zinc-950/90 shadow-sm z-10">
                <tr className="border-b border-zinc-800/70 text-zinc-400">
                  {fields.map((field) => (
                    <th key={field.path} className="px-3 py-2 font-medium">
                      {field.displayName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.slice(0, 50).map((row, index) => (
                  <tr
                    key={`row-${index}`}
                    className="border-b border-zinc-900/60 last:border-b-0 hover:bg-zinc-900/50 transition-colors"
                  >
                    {fields.map((field) => {
                      const value = getValueAtPath(row, field.path);
                      return (
                        <td key={`${field.path}-${index}`} className="px-3 py-2">
                          {formatFieldValue(field.type, value)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </WidgetContainer>
  );
}

export default memo(TableWidget);
