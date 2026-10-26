/**
 * Small building blocks shared by the Food and Travel screens.
 */
import { Minus, Plus } from "lucide-react";
import { cn } from "../../lib/utils";

export const Stepper = ({ value, min = 0, max, onChange, label, size = "md" }: {
  value: number; min?: number; max: number; onChange: (value: number) => void; label: string; size?: "sm" | "md";
}) => (
  <div
    role="group"
    aria-label={label}
    className={cn("inline-flex flex-none items-center rounded-full border border-[var(--control)] text-[var(--text-p)]", size === "sm" ? "h-8" : "h-10")}
  >
    <button
      type="button"
      onClick={() => onChange(value - 1)}
      disabled={value <= min}
      aria-label={`Fewer: ${label}`}
      className={cn("flex h-full items-center justify-center rounded-full transition-colors hover:bg-[var(--border)] disabled:opacity-40 disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:outline-[var(--accent)]", size === "sm" ? "w-8" : "w-10")}
    >
      <Minus className="h-4 w-4" />
    </button>
    <span className="tabular min-w-6 text-center text-sm font-medium" aria-live="polite">{value}</span>
    <button
      type="button"
      onClick={() => onChange(value + 1)}
      disabled={value >= max}
      aria-label={`More: ${label}`}
      className={cn("flex h-full items-center justify-center rounded-full transition-colors hover:bg-[var(--border)] disabled:opacity-40 disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:outline-[var(--accent)]", size === "sm" ? "w-8" : "w-10")}
    >
      <Plus className="h-4 w-4" />
    </button>
  </div>
);

export const PrimaryButton = ({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    type="button"
    {...props}
    className={cn(
      "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--bg)] transition-[opacity,transform] hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]",
      className
    )}
  >
    {children}
  </button>
);

export const SecondaryButton = ({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    type="button"
    {...props}
    className={cn(
      "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[var(--control)] px-5 text-sm font-medium text-[var(--text-p)] transition-colors hover:bg-[var(--border)] active:scale-[0.98] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]",
      className
    )}
  >
    {children}
  </button>
);
