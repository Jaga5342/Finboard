"use client";

import { forwardRef } from "react";
import type { ComponentPropsWithoutRef } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-zinc-900 text-white hover:bg-zinc-800",
  secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200",
  danger: "bg-red-600 text-white hover:bg-red-500",
  ghost:
    "bg-transparent text-zinc-900 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      className,
      disabled,
      type = "button",
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center rounded-md font-medium transition-colors " +
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 " +
      "focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 " +
      "dark:focus-visible:ring-zinc-50 dark:ring-offset-zinc-950";

    const classes = [
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        ref={ref}
        type={type}
        className={classes}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <span
              className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
              aria-hidden="true"
            />
            <span className="sr-only">Loading</span>
          </span>
        ) : null}
        <span className={isLoading ? "sr-only" : undefined}>{children}</span>
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
