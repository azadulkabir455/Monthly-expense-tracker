import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-card hover:shadow-float hover:scale-[1.02] dark:from-violet-500 dark:to-fuchsia-500",
        secondary:
          "bg-white text-slate-800 border border-[#ddd] shadow-card hover:bg-slate-50 hover:shadow-elevated dark:bg-white/5 dark:border-white/10 dark:text-foreground dark:hover:bg-white/10",
        outline:
          "border-2 border-violet-500/50 text-violet-400 hover:bg-violet-500/10 dark:hover:bg-violet-500/10",
        ghost: "hover:bg-slate-100 text-foreground dark:hover:bg-white/10",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-lg px-3 text-sm",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
