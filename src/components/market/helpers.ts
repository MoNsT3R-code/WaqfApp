/**
 * Formatting and motion settings shared by the marketplace screens (no components here,
 * so React Fast Refresh can keep the component files hot).
 */
import type { translations } from "../../translations";

type MarketLabels = (typeof translations)["en"]["market"];

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

export const countLabel = (t: MarketLabels, n: number, unit: "night" | "passenger") =>
  unit === "night"
    ? (n === 1 ? t.nightCount : fill(t.nightsCount, { n }))
    : (n === 1 ? t.passengerCount : fill(t.passengersCount, { n }));

/** Card motion shared by the masonry grids: a short staggered rise, and a lift on hover */
export const cardMotion = (index: number, reduce: boolean | null) => ({
  initial: reduce ? false : ({ opacity: 0, y: 14 } as const),
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay: reduce ? 0 : Math.min(index, 8) * 0.05, ease: [0.22, 1, 0.36, 1] as const },
  whileHover: reduce ? undefined : { y: -4 },
  whileTap: reduce ? undefined : { scale: 0.985 },
});
