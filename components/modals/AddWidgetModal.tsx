"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { testAPIConnection } from "@/services/api";
import { DisplayMode } from "@/types/widget";
import type { WidgetField } from "@/types/widget";
import { FieldType } from "@/types/api";
import { formatDate, formatNumber, truncateText } from "@/utils/formatters";
import { GripVertical, Plus, X } from "lucide-react";

interface AddWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd?: (payload: {
    name: string;
    apiUrl: string;
    refreshInterval: number;
    fields: WidgetField[];
    displayMode: DisplayMode;
  }) => void;
}

type TestStatus = "idle" | "loading" | "success" | "error";

const DISPLAY_MODE_OPTIONS = [
  { label: "Card", value: DisplayMode.CARD },
  { label: "Table", value: DisplayMode.TABLE },
  { label: "Chart", value: DisplayMode.CHART },
];

export default function AddWidgetModal({
  isOpen,
  onClose,
  onAdd,
}: AddWidgetModalProps) {
  const [name, setName] = useState("");
  const [apiUrl, setApiUrl] = useState("");
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");
  const [testMessage, setTestMessage] = useState("");
  const [testFields, setTestFields] = useState<WidgetField[]>([]);
  const [testData, setTestData] = useState<unknown>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>(DisplayMode.CARD);
  const [searchTerm, setSearchTerm] = useState("");
  const [showArraysOnly, setShowArraysOnly] = useState(false);
  const [selectedFields, setSelectedFields] = useState<WidgetField[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const isTestSuccess = testStatus === "success";
  const canSubmit =
    isTestSuccess && name.trim().length > 0 && selectedFields.length > 0;

  useEffect(() => {
    setTestStatus("idle");
    setTestMessage("");
    setTestFields([]);
    setTestData(null);
    setSelectedFields([]);
    setSearchTerm("");
  }, [apiUrl]);

  useEffect(() => {
    if (displayMode !== DisplayMode.TABLE && showArraysOnly) {
      setShowArraysOnly(false);
    }
  }, [displayMode, showArraysOnly]);

  const handleTest = async () => {
    if (!apiUrl.trim()) {
      setTestStatus("error");
      setTestMessage("Please enter a valid API URL.");
      return;
    }

    setTestStatus("loading");
    setTestMessage("");

    try {
      const result = await testAPIConnection(apiUrl.trim());

      if (!result.success || !result.accessible) {
        setTestStatus("error");
        setTestMessage(result.error?.message ?? "API test failed.");
        setTestFields([]);
        return;
      }

      const fields = (result.fields ?? []) as WidgetField[];
      const topLevel = new Set(fields.map((field) => field.path.split(".")[0]));

      setTestStatus("success");
      setTestFields(fields);
      setTestData(result.data ?? null);
      setSelectedFields([]);
      setTestMessage(
        `✓ API connection successful! ${topLevel.size} top-level fields found.`
      );
    } catch (error) {
      setTestStatus("error");
      setTestMessage(
        error instanceof Error ? error.message : "API test failed."
      );
    }
  };

  const handleAdd = () => {
    if (!canSubmit) return;
    onAdd?.({
      name: name.trim(),
      apiUrl: apiUrl.trim(),
      refreshInterval,
      fields: selectedFields,
      displayMode,
    });
  };

  const filteredFields = useMemo(() => {
    const searchValue = searchTerm.trim().toLowerCase();
    return testFields.filter((field) => {
      if (showArraysOnly && field.type !== FieldType.ARRAY) {
        return false;
      }
      if (!searchValue) return true;
      return (
        field.name.toLowerCase().includes(searchValue) ||
        field.path.toLowerCase().includes(searchValue) ||
        field.displayName.toLowerCase().includes(searchValue)
      );
    });
  }, [searchTerm, showArraysOnly, testFields]);

  const selectedPaths = useMemo(
    () => new Set(selectedFields.map((field) => field.path)),
    [selectedFields]
  );

  const handleAddField = (field: WidgetField) => {
    if (selectedPaths.has(field.path)) return;
    setSelectedFields((prev) => [...prev, { ...field }]);
  };

  const handleRemoveField = (path: string) => {
    setSelectedFields((prev) => prev.filter((field) => field.path !== path));
  };

  const handleReorderFields = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setSelectedFields((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  };

  const getSampleValue = (data: unknown, path: string): unknown => {
    if (!path) return data;
    const segments = path.split(".").filter(Boolean);
    let current: unknown = data;

    for (let i = 0; i < segments.length; i += 1) {
      const segment = segments[i];
      if (current === null || current === undefined) return undefined;

      if (Array.isArray(current)) {
        if (current.length === 0) return undefined;
        const index = Number(segment);
        if (!Number.isNaN(index)) {
          current = current[index];
          continue;
        }
        current = current[0];
        i -= 1;
        continue;
      }

      if (typeof current !== "object") return undefined;
      current = (current as Record<string, unknown>)[segment];
    }

    return current;
  };

  const formatSampleValue = (value: unknown, type: FieldType): string => {
    if (value === null || value === undefined) return "—";
    switch (type) {
      case FieldType.NUMBER: {
        const numeric = typeof value === "number" ? value : Number(value);
        return Number.isNaN(numeric) ? "—" : formatNumber(numeric, 2);
      }
      case FieldType.BOOLEAN:
        return value ? "true" : "false";
      case FieldType.DATE:
        return formatDate(String(value));
      case FieldType.ARRAY:
      case FieldType.OBJECT:
        return truncateText(JSON.stringify(value), 80);
      default:
        return truncateText(String(value), 80);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Widget"
      panelClassName="dark border border-zinc-800 bg-zinc-950 text-zinc-100"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleAdd}
            disabled={!canSubmit}
          >
            Add Widget
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <Input
          label="Widget Name"
          placeholder="e.g., Bitcoin Price Tracker"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="bg-zinc-900 text-zinc-100 placeholder:text-zinc-500"
        />

        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-100" htmlFor="api-url">
            API URL
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="api-url"
              type="text"
              placeholder="e.g., https://api.coinbase.com/v2/exchange-rates?currency=BTC"
              value={apiUrl}
              onChange={(event) => setApiUrl(event.target.value)}
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400/20"
            />
            <Button
              variant="secondary"
              size="md"
              onClick={handleTest}
              isLoading={testStatus === "loading"}
              disabled={!apiUrl.trim() || testStatus === "loading"}
            >
              Test
            </Button>
          </div>
          {testMessage ? (
            <p
              className={`text-sm ${
                testStatus === "success" ? "text-emerald-400" : "text-red-400"
              }`}
              role="status"
              aria-live="polite"
            >
              {testMessage}
            </p>
          ) : null}
        </div>

        <Input
          type="number"
          label="Refresh Interval (seconds)"
          value={refreshInterval}
          min={5}
          onChange={(event) => {
            const nextValue = Number(event.target.value);
            setRefreshInterval(Number.isNaN(nextValue) ? 0 : nextValue);
          }}
          className="bg-zinc-900 text-zinc-100 placeholder:text-zinc-500"
        />

        {isTestSuccess ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-zinc-100">
                Select Fields to Display
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                {DISPLAY_MODE_OPTIONS.map((option) => {
                  const isActive = displayMode === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setDisplayMode(option.value)}
                      className={[
                        "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                        isActive
                          ? "border-zinc-600 bg-zinc-800 text-zinc-100"
                          : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-zinc-200",
                      ].join(" ")}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <Input
              type="search"
              label="Search Fields"
              placeholder="Search by name or path"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="bg-zinc-900 text-zinc-100 placeholder:text-zinc-500"
            />

            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={showArraysOnly}
                disabled={displayMode !== DisplayMode.TABLE}
                onChange={(event) => setShowArraysOnly(event.target.checked)}
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-zinc-200 focus:ring-zinc-400 disabled:opacity-50"
              />
              Show arrays only (for table view)
            </label>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-zinc-100">
                    Available Fields
                  </h4>
                  <span className="text-xs text-zinc-500">
                    {filteredFields.length} fields
                  </span>
                </div>
                <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900/40 p-2">
                  {filteredFields.length === 0 ? (
                    <div className="p-4 text-center text-sm text-zinc-500">
                      No fields match your search.
                    </div>
                  ) : (
                    filteredFields.map((field) => {
                      const sampleValue = formatSampleValue(
                        getSampleValue(testData, field.path),
                        field.type
                      );
                      const isSelected = selectedPaths.has(field.path);

                      return (
                        <div
                          key={field.path}
                          className="flex items-start justify-between gap-3 rounded-md border border-zinc-800/70 bg-zinc-950/60 p-3"
                        >
                          <div className="min-w-0 space-y-1">
                            <div className="text-xs font-medium text-zinc-200">
                              {field.displayName}
                            </div>
                            <div className="truncate text-xs text-zinc-500">
                              {field.path}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                              <span className="rounded-full border border-zinc-700/80 bg-zinc-900 px-2 py-0.5">
                                {field.type}
                              </span>
                              <span className="truncate">
                                Sample: {sampleValue}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddField(field)}
                            disabled={isSelected}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-700/70 text-zinc-200 transition-colors hover:border-zinc-500 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label="Add field"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-zinc-100">
                    Selected Fields
                  </h4>
                  <span className="text-xs text-zinc-500">
                    {selectedFields.length} selected
                  </span>
                </div>
                <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900/40 p-2">
                  {selectedFields.length === 0 ? (
                    <div className="p-4 text-center text-sm text-zinc-500">
                      Add fields to display them in the widget.
                    </div>
                  ) : (
                    selectedFields.map((field, index) => (
                      <div
                        key={field.path}
                        className="flex items-start gap-2 rounded-md border border-zinc-800/70 bg-zinc-950/60 p-3"
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => {
                          if (dragIndex === null) return;
                          handleReorderFields(dragIndex, index);
                          setDragIndex(null);
                        }}
                      >
                        <button
                          type="button"
                          draggable
                          onDragStart={(event) => {
                            event.dataTransfer.setData("text/plain", field.path);
                            setDragIndex(index);
                          }}
                          onDragEnd={() => setDragIndex(null)}
                          className="mt-1 inline-flex cursor-grab text-zinc-500 hover:text-zinc-300"
                          aria-label="Reorder field"
                        >
                          <GripVertical className="h-4 w-4" />
                        </button>
                        <div className="flex-1 space-y-2">
                          <input
                            value={field.displayName}
                            onChange={(event) => {
                              const value = event.target.value;
                              setSelectedFields((prev) =>
                                prev.map((item) =>
                                  item.path === field.path
                                    ? { ...item, displayName: value }
                                    : item
                                )
                              );
                            }}
                            className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none"
                            placeholder="Display name"
                          />
                          <div className="text-xs text-zinc-500">
                            {field.path} · {field.type}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveField(field.path)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-700/70 text-zinc-300 transition-colors hover:border-red-500/60 hover:text-red-300"
                          aria-label="Remove field"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            className={[
              "rounded-lg border border-dashed border-zinc-800 bg-zinc-900/40 p-4 text-sm text-zinc-400",
              isTestSuccess ? "opacity-100" : "pointer-events-none opacity-50",
            ].join(" ")}
          >
            Field selection will be available after a successful API test.
          </div>
        )}
      </div>
    </Modal>
  );
}
