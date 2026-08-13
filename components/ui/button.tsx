import * as React from "react";
import { cn } from "@/lib/utils";

export function Button({
  className,
  variant = "default",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "outline" | "ghost";
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-3 transition-colors disabled:opacity-50 disabled:pointer-events-none",
        variant === "default" && "bg-zinc-900 text-white hover:bg-zinc-800",
        variant === "secondary" && "bg-zinc-100 text-zinc-900 hover:bg-zinc-200",
        variant === "outline" &&
          "border border-zinc-300 bg-white hover:bg-zinc-50",
        variant === "ghost" && "hover:bg-zinc-100",
        className,
      )}
      {...props}
    />
  );
}
