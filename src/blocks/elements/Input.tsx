import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-xl border px-4 py-2 text-foreground placeholder:text-muted-foreground backdrop-blur-sm transition-colors",
        "border-[#ddd] bg-white shadow-sm dark:border-white/10 dark:bg-white/5",
        "focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
