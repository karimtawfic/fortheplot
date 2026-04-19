import React from "react";
import { clsx } from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={clsx(
        "rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
        {
          "bg-primary text-white hover:bg-primary/90": variant === "primary",
          "bg-surface text-white hover:bg-surface/80 border border-white/10":
            variant === "secondary",
          "bg-transparent text-white/70 hover:text-white": variant === "ghost",
          "bg-red-500 text-white hover:bg-red-600": variant === "danger",
        },
        {
          "px-3 py-2 text-sm": size === "sm",
          "px-5 py-3 text-base": size === "md",
          "px-6 py-4 text-lg": size === "lg",
        },
        className
      )}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
