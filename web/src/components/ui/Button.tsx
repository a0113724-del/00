import { Loader2 } from "lucide-react";
import { cn } from "./cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "buy" | "sell";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-on-accent hover:bg-accent-hover",
  secondary: "bg-surface-2 text-text border border-border hover:border-border-input",
  ghost: "bg-transparent text-text hover:bg-surface-2",
  danger: "bg-danger text-on-danger hover:opacity-90",
  buy: "bg-success text-on-success hover:opacity-90",
  sell: "bg-danger text-on-danger hover:opacity-90",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-13 px-6 text-md",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  full?: boolean;
  icon?: React.ReactNode;
}

export function Button({ variant = "primary", size = "md", loading, full, icon, className, children, disabled, type = "button", ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-[background,opacity,transform,border-color] duration-150 active:scale-[.98]",
        "disabled:opacity-50 disabled:pointer-events-none",
        variants[variant], sizes[size], full && "w-full", className,
      )}
      {...rest}
    >
      {loading ? <Loader2 aria-hidden className="size-4 animate-spin" /> : icon}
      <span>{children}</span>
    </button>
  );
}
