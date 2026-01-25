"use client";

import { forwardRef, useId } from "react";
import type { ComponentPropsWithoutRef } from "react";

type InputType = "text" | "number" | "search";

interface InputProps extends Omit<ComponentPropsWithoutRef<"input">, "type"> {
  type?: InputType;
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ type = "text", label, error, id, className, ...props }, ref) => {
    const inputId = id ?? useId();
    const errorId = error ? `${inputId}-error` : undefined;
    const isSearch = type === "search";

    const baseClasses =
      "block w-full rounded-md border bg-white px-3 py-2 text-sm text-zinc-900 " +
      "shadow-sm transition-colors focus:border-zinc-900 focus:outline-none " +
      "focus:ring-2 focus:ring-zinc-900/20 disabled:cursor-not-allowed " +
      "disabled:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 " +
      "dark:text-zinc-50 dark:focus:border-zinc-50 dark:focus:ring-zinc-50/20";

    const errorClasses = error
      ? "border-red-500 focus:border-red-600 focus:ring-red-500/20"
      : "border-zinc-300";

    const searchClasses = isSearch ? "pl-9" : "";

    const classes = [baseClasses, errorClasses, searchClasses, className]
      .filter(Boolean)
      .join(" ");

    return (
      <div className="space-y-1">
        {label ? (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
          >
            {label}
          </label>
        ) : null}
        <div className="relative">
          {isSearch ? (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </span>
          ) : null}
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={classes}
            aria-invalid={Boolean(error)}
            aria-describedby={errorId}
            {...props}
          />
        </div>
        {error ? (
          <p id={errorId} className="text-sm text-red-600">
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
