import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "neutral" | "success" | "warning" | "outline";
}

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  const variantStyles = {
    neutral: "bg-[#F3F3EF] text-[#383833] border-[#E5E5E0]",
    success: "bg-[#EBF2EE] text-[#1E3A2F] border-[#C2D6CC]",
    warning: "bg-[#FDF6E2] text-[#8C6D1F] border-[#EBDCA3]",
    outline: "bg-white text-[#5C5C57] border-[#E5E5E0]",
  }[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] text-[11px] font-mono font-medium border uppercase tracking-wider",
        variantStyles,
        className
      )}
      {...props}
    />
  );
}
