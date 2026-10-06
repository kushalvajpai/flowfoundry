import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1E3A2F] focus-visible:ring-offset-1 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-50 select-none rounded-[3px]";

    const variantStyles = {
      primary: "bg-[#1E3A2F] text-white hover:bg-[#162E25] active:bg-[#11241D] border border-[#1E3A2F]",
      secondary: "bg-[#F3F3EF] text-[#1A1A1A] hover:bg-[#EAEAE4] border border-[#E5E5E0]",
      outline: "bg-white text-[#1A1A1A] hover:bg-[#F3F3EF] border border-[#D4D4CE] active:bg-[#EAEAE4]",
      ghost: "text-[#5C5C57] hover:text-[#1A1A1A] hover:bg-[#F3F3EF]",
    }[variant];

    const sizeStyles = {
      sm: "h-8 px-3 text-xs rounded-[3px] gap-1.5",
      md: "h-9 px-4 text-xs font-medium rounded-[3px] gap-2",
      lg: "h-10 px-5 text-sm font-medium rounded-[3px] gap-2",
    }[size];

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles, sizeStyles, className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
