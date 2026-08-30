import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-sm border font-typewriter uppercase tracking-widest transition-all duration-100 shadow-paper hover:-translate-y-0.5 hover:shadow-lift active:translate-y-0 active:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-cream focus-visible:ring-corp disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-paper";

const variants: Record<Variant, string> = {
  primary: "border-ink bg-corp text-cream",
  secondary: "border-ink/60 bg-cream text-ink",
  ghost: "border-ink/40 bg-parchment text-ink",
  danger: "border-ink bg-stamp text-cream",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-[11px]",
  md: "h-11 px-5 text-xs",
  lg: "h-14 px-7 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading = false, className = "", children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});
