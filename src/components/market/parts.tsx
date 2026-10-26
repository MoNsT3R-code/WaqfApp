/**
 * Small building blocks shared by the Food and Travel screens.
 */
import { Minus, Plus } from "lucide-react";
import { cn } from "../../lib/utils";

/** Whole-rupee prices, as menus and rate cards quote them */
export const formatPkr = (amount: number) => `PKR ${Math.round(amount).toLocaleString("en-US")}`;

/** "Sat 14 Nov" in the app's language, with Latin digits like the rest of the app */
export const formatDay = (iso: string, lang: string) =>
  new Intl.DateTimeFormat(lang === "en" ? "en-GB" : lang, { weekday: "short", day: "numeric", month: "short", numberingSystem: "latn" })
    .format(new Date(`${iso}T00:00:00`));

export const formatDuration = (minutes: number) => `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")} m`;

/** Fills {name} placeholders in a translated string */
export const fill = (text: string, values: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ""));

// Neighbouring rows sit at least 60 degrees apart; no violet, and clear of the cyan accent
const HUES = [18, 140, 340, 80, 210];
const SKIP = new Set(["the", "restaurant", "hotel", "lahore", "by", "&"]);

export const Monogram = ({ name, index, size = 48, image }: { name: string; index: number; size?: number; image?: string }) => {
  if (image) {
    return <img src={image} alt="" width={size} height={size} className="flex-none rounded-lg object-cover" style={{ width: size, height: size }} />;
  }
  const initials = name.split(/\s+/).filter(w => !SKIP.has(w.toLowerCase())).slice(0, 2).map(w => w[0]).join("");
  return (
    <span className="monogram" aria-hidden style={{ width: size, height: size, fontSize: size * 0.36, ["--h" as any]: HUES[index % HUES.length] }}>
      {initials}
    </span>
  );
};

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

/** Underline tabs on a full-width rule */
export function Tabs<T extends string>({ tabs, active, onChange, label }: {
  tabs: { id: T; label: string; count?: number }[]; active: T; onChange: (id: T) => void; label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-6 overflow-x-auto border-b border-[var(--border)] scrollbar-hide">
      {tabs.map(tab => (
        <button
          key={tab.id}
          role="tab"
          type="button"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "-mb-px flex-none whitespace-nowrap border-b-2 pb-3 pt-1 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)]",
            active === tab.id ? "border-[var(--accent)] font-medium text-[var(--text-p)]" : "border-transparent text-[var(--text-s)] hover:text-[var(--text-p)]"
          )}
        >
          {tab.label}
          {tab.count !== undefined && <span className="tabular ml-1.5 text-[var(--text-s)]">{tab.count}</span>}
        </button>
      ))}
    </div>
  );
}

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
