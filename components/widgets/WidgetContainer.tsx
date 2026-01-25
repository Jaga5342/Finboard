"use client";

import { useMemo } from "react";
import type { ReactNode } from "react";
import {
  RefreshCw,
  Settings,
  Trash2,
  GripVertical,
  RotateCcw,
} from "lucide-react";

interface WidgetContainerProps {
  name: string;
  onNameChange?: (name: string) => void;
  refreshInterval?: number; // milliseconds
  isLoading?: boolean;
  error?: string | null;
  lastUpdated?: Date | string | null;
  onRefresh?: () => void;
  onSettings?: () => void;
  onDelete?: () => void;
  onRetry?: () => void;
  children?: ReactNode;
  loadingContent?: ReactNode;
  dragHandleClassName?: string;
}

function formatInterval(intervalMs?: number): string {
  if (!intervalMs || intervalMs <= 0) return "—";
  const seconds = Math.round(intervalMs / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.round(seconds / 60);
  return `${minutes}m`;
}

function formatTime(value?: Date | string | null): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

export default function WidgetContainer({
  name,
  onNameChange,
  refreshInterval,
  isLoading = false,
  error,
  lastUpdated,
  onRefresh,
  onSettings,
  onDelete,
  onRetry,
  children,
  loadingContent,
  dragHandleClassName = "drag-handle",
}: WidgetContainerProps) {
  const intervalLabel = useMemo(
    () => formatInterval(refreshInterval),
    [refreshInterval]
  );
  const updatedLabel = useMemo(
    () => formatTime(lastUpdated),
    [lastUpdated]
  );

  return (
    <div className="group relative flex h-full w-full flex-col rounded-xl border border-zinc-800/80 bg-zinc-950 text-zinc-100 shadow-lg shadow-black/30">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-800/60 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className={`inline-flex items-center justify-center rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 ${dragHandleClassName}`}
            aria-label="Drag widget"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <label className="sr-only" htmlFor={`widget-name-${name}`}>
              Widget name
            </label>
            <input
              id={`widget-name-${name}`}
              value={name}
              onChange={(event) => onNameChange?.(event.target.value)}
              className="w-full truncate bg-transparent text-sm font-semibold text-zinc-100 outline-none ring-0 placeholder:text-zinc-500"
              placeholder="Widget name"
            />
            <div className="mt-1 inline-flex items-center rounded-full border border-zinc-700/80 bg-zinc-900/60 px-2 py-0.5 text-xs text-zinc-300">
              {intervalLabel}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center justify-center rounded-md p-2 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
            aria-label="Refresh widget"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onSettings}
            className="inline-flex items-center justify-center rounded-md p-2 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
            aria-label="Widget settings"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center justify-center rounded-md p-2 text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            aria-label="Delete widget"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-4 py-4">
        {isLoading ? (
          loadingContent ? (
            loadingContent
          ) : (
            <div className="space-y-3">
              <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-800/80" />
              <div className="h-4 w-full animate-pulse rounded bg-zinc-800/60" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-zinc-800/60" />
              <div className="h-24 w-full animate-pulse rounded bg-zinc-800/40" />
            </div>
          )
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-red-900/40 bg-red-950/10 px-4 py-6 text-center">
            <div className="rounded-full bg-red-900/20 p-3">
              <Trash2 className="h-6 w-6 text-red-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-red-200">Unable to load data</h3>
              <p className="text-xs text-red-300/80">
                {error || "An unexpected error occurred while fetching data."}
              </p>
            </div>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-2 rounded-md border border-red-800/50 bg-red-900/20 px-4 py-2 text-xs font-medium text-red-200 transition-colors hover:bg-red-900/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Retry Request
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1 min-h-0">{children}</div>
        )}
      </div>

      <div className="border-t border-zinc-800/60 px-4 py-2 text-xs text-zinc-400">
        Last updated: {updatedLabel}
      </div>
    </div>
  );
}
