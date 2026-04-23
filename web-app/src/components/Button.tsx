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
  style,
  ...props
}: ButtonProps) {
  const isPrimary = variant === "primary";

  return (
    <button
      {...props}
      disabled={disabled || loading}
      style={
        isPrimary
          ? { background: "linear-gradient(135deg, #FF6B35, #E94560)", ...style }
          : style
      }
      className={clsx(
        "rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
        {
          "text-white shadow-glow": isPrimary,
          "bg-surface text-white border border-border hover:bg-surface/80": variant === "secondary",
          "bg-transparent text-primary hover:text-primary/80": variant === "ghost",
          "bg-accent text-white hover:bg-accent/90": variant === "danger",
        },
        {
          "px-4 py-2.5 text-sm": size === "sm",
          "px-5 py-3.5 text-base": size === "md",
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
