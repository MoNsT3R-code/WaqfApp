/**
 * The line between spend and save, after the Smart Spend & Save prototype: the whole
 * deposit as one bar, the spending budget on the left, savings on the right, what is
 * spent filled in, any overspend eating into savings, ticks at 75% and 90% of the
 * budget and the savings floor marked. Widths animate when the numbers change.
 */
import { motion, useReducedMotion } from "motion/react";
import { cn } from "../../lib/utils";
import { fill, formatPkr } from "../market/helpers";
import type { Plan } from "./api";
import type { translations } from "../../translations";

type PlanLabels = (typeof translations)["en"]["plan"];

const pct = (x: number, total: number) => (total > 0 ? Math.max(0, Math.min(100, (x * 100) / total)) : 0);

export function SplitBar({ plan, spent, t, size = "md", moving = 0, belowFloor = false }: {
  plan: Plan; spent: number; t: PlanLabels; size?: "sm" | "md" | "lg"; moving?: number; belowFloor?: boolean;
}) {
  const reduce = useReducedMotion();
  const total = plan.spendLimit + plan.savings;
  const over = Math.max(0, spent - plan.spendLimit);
  const spendW = pct(plan.spendLimit, total);
  const spentW = pct(Math.min(spent, plan.spendLimit), total);
  const overW = pct(Math.min(over, plan.savings), total);
  const movingW = pct(Math.min(moving, plan.savings), total);
  const floorX = plan.floor != null && plan.floor > 0 && plan.floor <= plan.savings ? pct(total - plan.floor, total) : null;
  const ticks = [0.75, 0.9].map(f => pct(plan.spendLimit * f, total));
  const height = size === "sm" ? "h-7" : size === "lg" ? "h-16" : "h-11";
  const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 140, damping: 22 };
  const label = `${t.budgetFact} ${formatPkr(plan.spendLimit)}, ${formatPkr(spent)} spent. ${t.savingsFact} ${formatPkr(plan.savings)}.`;

  return (
    <figure role="img" aria-label={label}>
      <div className={cn("relative w-full overflow-hidden rounded-xl bg-[var(--save)]", height)}>
        <motion.div className="absolute inset-y-0 start-0 bg-[var(--spend-soft)]" animate={{ width: `${spendW}%` }} transition={spring} />
        <motion.div className="absolute inset-y-0 start-0 bg-[var(--spend)]" animate={{ width: `${spentW}%` }} transition={spring} />
        {/* Overspend comes out of savings: drawn past the divider in the negative colour */}
        <motion.div className="absolute inset-y-0 bg-[var(--negative)]" animate={{ insetInlineStart: `${spendW}%`, width: `${overW}%` }} transition={spring} />
        {/* A move being previewed: the part of savings about to join the budget */}
        {moving > 0 && (
          <motion.div
            className={cn("absolute inset-y-0", belowFloor ? "bg-[var(--negative)]/60" : "bg-[var(--spend-soft)]")}
            style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent 0 6px, rgba(255,255,255,.18) 6px 9px)" }}
            animate={{ insetInlineStart: `${spendW}%`, width: `${movingW}%` }}
            transition={spring}
          />
        )}
        {size !== "sm" && ticks.map(x => <span key={x} className="absolute inset-y-1.5 w-px bg-black/35" style={{ insetInlineStart: `${x}%` }} />)}
        {floorX != null && <span className="absolute inset-y-0 w-0.5 bg-white/80" style={{ insetInlineStart: `${floorX}%` }} title={fill(t.floor, { amount: formatPkr(plan.floor!) })} />}
        <motion.span className="absolute -inset-y-0 w-1 -translate-x-1/2 rounded bg-[var(--text-p)]" animate={{ insetInlineStart: `${spendW + movingW}%` }} transition={spring} />
      </div>
      <figcaption aria-hidden className="tabular mt-2 flex justify-between gap-4 text-[13px]">
        <span>
          <b className="me-1.5 font-semibold text-[var(--spend)]">{t.spend}</b>
          <span className="text-[var(--text-p)]">{formatPkr(plan.spendLimit + Math.min(moving, plan.savings))}</span>
          {size === "lg" || size === "md" ? <small className="ms-2 text-[var(--text-s)]">{t.ticks}</small> : null}
        </span>
        <span className="text-end">
          <b className="me-1.5 font-semibold text-[var(--save)]">{t.save}</b>
          <span className="text-[var(--text-p)]">{formatPkr(plan.savings - Math.min(moving, plan.savings))}</span>
          {plan.floor != null && size !== "sm" && <small className="ms-2 text-[var(--text-s)]">{fill(t.floor, { amount: formatPkr(plan.floor) })}</small>}
        </span>
      </figcaption>
    </figure>
  );
}
