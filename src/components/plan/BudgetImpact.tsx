/**
 * What a payment would do to this month's budget, checked as the amount is typed
 * (Send Money, Bills). Shows nothing until a month has been started.
 */
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "../../lib/utils";
import { api, type Verdict } from "./api";

export function BudgetImpact({ amount, label }: { amount: string; label: string }) {
  const [impact, setImpact] = useState<Verdict | null>(null);

  useEffect(() => {
    const value = parseFloat(amount);
    if (!(value > 0)) { setImpact(null); return; }
    const timer = setTimeout(async () => {
      const res = await api<{ impact: Verdict | null }>("POST", "/api/plan/impact", { amount: value });
      setImpact(res.ok ? res.body.impact : null);
    }, 250);
    return () => clearTimeout(timer);
  }, [amount]);

  return (
    <AnimatePresence initial={false}>
      {impact && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
          aria-live="polite"
        >
          <div className="rounded-2xl bg-[var(--raised)] px-4 py-3 text-[13px]">
            <p className="text-[var(--text-s)]">{label}</p>
            <p className={cn("mt-0.5 font-semibold", impact.tone === "ok" ? "text-[var(--positive)]" : impact.tone === "warn" ? "text-[var(--spend)]" : "text-[var(--negative)]")}>{impact.verdict}</p>
            <p className="tabular mt-0.5 text-[var(--text-p)]">{impact.lines[0]}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
