/**
 * Smart Spend & Save: the monthly split between a spending budget and savings,
 * ported from the Smart Spend & Save prototype (Allied Bank Fintech Hackathon 2026).
 * Pure functions over rupee amounts; the service and the decision graph call them.
 */

export type Plan = {
  deposit: number;        // the salary or deposit that was split
  pct: number;            // spending share, 10–90
  spendLimit: number;     // current spending budget (grows when savings are moved in)
  savings: number;        // current savings
  flexible: boolean;      // flexible savings can be moved after confirmation; protected cannot
  floor: number | null;   // savings should not fall below this (warning only)
  transferred: number;    // moved from savings this month
  startedAt: string;      // ISO time the month started
  monthLabel: string;     // "October 2026"
  daysInMonth: number;
  startDay: number;       // day of the month the plan started
};

export class PlanError extends Error {}

const round2 = (n: number) => Math.round(n * 100) / 100;
export const pkr = (n: number) => `PKR ${round2(n).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

export function allocate(deposit: number, pct: number, flexible: boolean, floor: number | null, now = new Date()): Plan {
  if (!Number.isFinite(deposit) || deposit <= 0) throw new PlanError("Enter an amount greater than zero.");
  if (!(pct >= 10 && pct <= 90)) throw new PlanError("Choose a spending share between 10% and 90%.");
  if (floor != null && (!Number.isFinite(floor) || floor < 0)) throw new PlanError("The savings floor can't be negative.");
  const spendLimit = round2(deposit * pct / 100);
  return {
    deposit: round2(deposit), pct, spendLimit, savings: round2(deposit - spendLimit), flexible, floor: floor == null ? null : round2(floor),
    transferred: 0, startedAt: now.toISOString(),
    monthLabel: now.toLocaleString("en-GB", { month: "long", year: "numeric" }),
    daysInMonth: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
    startDay: now.getDate(),
  };
}

export const remaining = (spent: number, p: Plan) => Math.max(0, round2(p.spendLimit - spent));

/** 0, 75, 90 or 100: the highest warning the spending has crossed */
export function thresholdLevel(spent: number, limit: number) {
  if (limit <= 0) return 100;
  const used = spent * 100 / limit;
  return used >= 100 ? 100 : used >= 90 ? 90 : used >= 75 ? 75 : 0;
}

export function limitMessage(p: Plan, spent: number) {
  const over = round2(spent - p.spendLimit);
  let t = `You have reached your spending limit of ${pkr(p.spendLimit)}. `;
  t += over > 0 ? `You are ${pkr(over)} over your planned budget` : `Your remaining planned spending budget is ${pkr(remaining(spent, p))}`;
  t += `, while ${pkr(p.savings)} remains in your ${p.flexible ? "flexible" : "protected"} savings.`;
  t += p.flexible
    ? " Would you like to move some money from savings to your spending budget?"
    : " Your savings are protected, so they can’t be moved unless you change this in Savings.";
  return t;
}

export function thresholdNotice(level: number, spent: number, p: Plan) {
  const left = pkr(remaining(spent, p));
  if (level === 75) return `You have used 75% of your planned spending budget. ${left} remains.`;
  if (level === 90) return `You have used 90% of your planned spending budget. Only ${left} remains.`;
  if (level === 100) return limitMessage(p, spent);
  return "";
}

export type TransferPreview = { amount: number; savingsAfter: number; spendLimitAfter: number; remainingAfter: number; belowFloor: boolean };

export function previewTransfer(p: Plan, spent: number, amount: number): TransferPreview {
  if (!p.flexible) throw new PlanError("Your savings are protected. Switch them to flexible in Savings to move money.");
  if (!Number.isFinite(amount)) throw new PlanError("Enter an amount, for example 5,000.");
  if (amount <= 0) throw new PlanError("The amount must be more than zero.");
  if (amount > p.savings) throw new PlanError(`You have ${pkr(p.savings)} in savings.`);
  const spendLimitAfter = round2(p.spendLimit + amount);
  const savingsAfter = round2(p.savings - amount);
  return { amount: round2(amount), savingsAfter, spendLimitAfter, remainingAfter: Math.max(0, round2(spendLimitAfter - spent)), belowFloor: p.floor != null && savingsAfter < p.floor };
}

export const applyTransfer = (p: Plan, t: TransferPreview): Plan =>
  ({ ...p, spendLimit: t.spendLimitAfter, savings: t.savingsAfter, transferred: round2(p.transferred + t.amount) });

/** "Shoes 7,000", "rs 2.5k", "1 lakh": the amount in rupees, or null */
export function parseAmount(text: unknown): number | null {
  const cleaned = String(text ?? "").replace(/rs\.?|pkr/gi, " ");
  const m = cleaned.match(/(\d[\d,]*(?:\.\d+)?)\s*(k|thousand|lakhs?|lacs?)?(?![a-z])/i);
  if (!m) return null;
  let n = parseFloat(m[1].replace(/,/g, ""));
  if (!Number.isFinite(n)) return null;
  const unit = (m[2] || "").toLowerCase();
  if (unit === "k" || unit === "thousand") n *= 1000;
  else if (unit.startsWith("la")) n *= 100000;
  return round2(n);
}

const daysWord = (n: number) => `${n} ${n === 1 ? "day" : "days"}`;

/** Days left in the month, counting today */
export const daysLeft = (p: Plan, now = new Date()) => Math.max(1, p.daysInMonth - now.getDate() + 1);

/** The daily amount to aim for, and when the budget runs out at the current pace */
export function pace(p: Plan, spent: number, now = new Date()) {
  const left = daysLeft(p, now);
  const rest = remaining(spent, p);
  const perDay = Math.floor(rest / left / 100) * 100;
  const month = p.monthLabel.split(" ")[0];
  if (rest <= 0) {
    return { perDay: 0, daysLeft: left, head: `Budget used up with ${daysWord(left)} left in ${month}.`, sub: "New spending will show as over budget unless you move money from savings." };
  }
  if (spent <= 0) {
    return { perDay, daysLeft: left, head: `${pkr(perDay)} a day`, sub: `is what your budget allows for the ${daysWord(left)} left in ${month}.` };
  }
  const elapsed = Math.max(1, now.getDate() - p.startDay + 1);
  const rate = spent / elapsed;
  const runOut = now.getDate() + Math.floor(rest / rate);
  return {
    perDay, daysLeft: left,
    head: runOut >= p.daysInMonth ? "At this pace, your budget lasts the month." : `At this pace, your budget runs out around ${month} ${runOut}.`,
    sub: `To make it last, aim for ${pkr(perDay)} a day for the ${daysWord(left)} left.`,
  };
}

export type Verdict = { tone: "ok" | "warn" | "alert"; verdict: string; lines: string[] };

/** Before a purchase: does it fit, how much a day is left, and would it need savings? */
export function affordability(p: Plan, spent: number, amount: number, now = new Date()): Verdict {
  const left = daysLeft(p, now);
  const after = spent + amount;
  const leftAfter = round2(p.spendLimit - after);
  const pctAfter = p.spendLimit ? Math.floor(after * 100 / p.spendLimit) : 100;
  const movable = p.flexible ? Math.max(0, p.savings - (p.floor ?? 0)) : 0;
  const month = p.monthLabel.split(" ")[0];
  if (leftAfter >= 0) {
    const perDay = Math.floor(leftAfter / left / 100) * 100;
    return {
      tone: pctAfter >= 90 ? "warn" : "ok",
      verdict: pctAfter >= 90 ? "Fits, but it’s tight" : "Fits your budget",
      lines: [`You’d have ${pkr(leftAfter)} left, about ${pkr(perDay)} a day for the ${daysWord(left)} left in ${month}.`, `Your budget would be ${pctAfter}% used.`],
    };
  }
  const over = -leftAfter;
  const lines = [remaining(spent, p) > 0 ? `You have ${pkr(remaining(spent, p))} left to spend.` : "Your spending budget is already used up."];
  if (!p.flexible) lines.push("Your savings are protected, so this would show as over budget.");
  else if (over <= movable) lines.push(`You could cover it by moving ${pkr(over)} from savings and still keep ${pkr(p.savings - over)}.`);
  else if (over <= p.savings) lines.push(`Covering it would take savings down to ${pkr(p.savings - over)}, below your floor of ${pkr(p.floor ?? 0)}.`);
  else lines.push(`That’s more than your savings of ${pkr(p.savings)}.`);
  return { tone: "alert", verdict: `Over budget by ${pkr(over)}`, lines };
}

export function breakdownText(categories: Record<string, number>) {
  const rows = Object.entries(categories).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  if (!rows.length) return "No spending recorded yet this month.";
  return "Where your spending went:\n" + rows.map(([k, v]) => `${k}: ${pkr(v)}`).join("\n");
}
