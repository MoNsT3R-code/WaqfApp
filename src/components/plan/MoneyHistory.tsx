/**
 * Money history: the real closing balance of each of the last 14 days, worked out
 * from the ledger, and this month's Smart Spend & Save picture (split, pace and
 * spending by category) when a month has been started.
 */
import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { motion } from "motion/react";
import { cn } from "../../lib/utils";
import { fill, formatPkr } from "../market/helpers";
import { PrimaryButton } from "../market/parts";
import { CategoryList } from "./LimitDecision";
import { SplitBar } from "./SplitBar";
import { statusLine, toneText } from "./SavingsScreen";
import type { PlanDashboard } from "./api";
import type { translations } from "../../translations";

type Labels = (typeof translations)["en"];
type Tx = { amount: number; date: string };

const DAYS = 14;

/** Closing balance per day: today's balance, minus everything that happened after each day ended */
export function dailyBalances(balance: number, transactions: Tx[], now = new Date()) {
  const days = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1).getTime();
    const later = transactions.filter(t => new Date(t.date).getTime() >= end).reduce((s, t) => s + t.amount, 0);
    const day = new Date(end - 1);
    days.push({ day: day.toLocaleDateString("en-GB", { day: "numeric", month: "short" }), balance: Math.round((balance - later) * 100) / 100 });
  }
  return days;
}

const compact = (v: number) => (Math.abs(v) >= 1_000_000 ? `${(v / 1_000_000).toFixed(2)}M` : `${Math.round(v / 1000)}k`);

export function MoneyHistory({ labels, balance, transactions, plan, onOpenSavings }: {
  labels: Labels; balance: number; transactions: Tx[]; plan: PlanDashboard | null; onOpenSavings: () => void;
}) {
  const t = labels.plan;
  const data = useMemo(() => dailyBalances(balance, transactions), [balance, transactions]);
  const values = data.map(d => d.balance);
  const min = Math.min(...values), max = Math.max(...values);
  const pad = Math.max(1000, (max - min) * 0.15);

  return (
    <div className="space-y-8 rounded-[32px] border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8">
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-base font-semibold text-[var(--text-p)]">{labels.volumeTrajectory}</h2>
          <span className="text-[13px] text-[var(--text-s)]">{t.balanceHistory}</span>
        </div>
        <div className="mt-4 h-[200px]">
          <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 600, height: 200 }}>
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="balanceFade" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.14} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="day" stroke="var(--text-s)" fontSize={11} tickLine={false} axisLine={false} interval={3} />
              <YAxis domain={[Math.floor((min - pad) / 1000) * 1000, Math.ceil((max + pad) / 1000) * 1000]} tickFormatter={compact} stroke="var(--text-s)" fontSize={11} tickLine={false} axisLine={false} width={48} tickCount={4} />
              <Tooltip
                formatter={(v: number) => [formatPkr(v), labels.balance]}
                contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }}
                itemStyle={{ color: "var(--text-p)", fontSize: 12 }}
                labelStyle={{ color: "var(--text-s)", fontSize: 12 }}
              />
              {/* A balance only changes when a payment happens, so the line steps */}
              <Area type="stepAfter" dataKey="balance" stroke="var(--accent)" strokeWidth={2} fill="url(#balanceFade)" isAnimationActive />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {plan?.plan ? (
        <div className="space-y-6">
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-[15px] font-semibold text-[var(--text-p)]">{t.title} · {plan.plan.monthLabel}</h3>
              <span className={cn("text-[13px] font-semibold", toneText(statusLine(plan, t).tone))}>{statusLine(plan, t).text}</span>
            </div>
            <div className="mt-3"><SplitBar plan={plan.plan} spent={plan.spent ?? 0} t={t} /></div>
          </div>
          <div className="space-y-3">
            {[
              { label: t.budgetUsed, value: plan.usedPct ?? 0, cls: (plan.level ?? 0) >= 90 ? "bg-[var(--negative)]" : "bg-[var(--spend)]" },
              { label: fill(t.monthPassed, { month: plan.plan.monthLabel.split(" ")[0] }), value: plan.monthPct ?? 0, cls: "bg-[var(--text-s)]" },
            ].map(row => (
              <div key={row.label} className="text-sm">
                <div className="tabular flex justify-between"><span className="text-[var(--text-p)]">{row.label}</span><span className="text-[var(--text-p)]">{Math.round(row.value)}%</span></div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--border)]">
                  <motion.div className={cn("h-full rounded-full", row.cls)} initial={{ width: 0 }} animate={{ width: `${Math.min(100, row.value)}%` }} transition={{ type: "spring", stiffness: 120, damping: 22 }} />
                </div>
              </div>
            ))}
            <p className="text-[13px] text-[var(--text-s)]">
              {(plan.usedPct ?? 0) > (plan.monthPct ?? 0) + 10 ? t.paceFast : (plan.usedPct ?? 0) < (plan.monthPct ?? 0) - 10 ? t.paceSlow : t.paceEven}
            </p>
          </div>
          <CategoryList categories={plan.categories || {}} t={t} />
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[var(--raised)] p-5">
          <p className="text-sm text-[var(--text-p)]">{t.splitSalary}</p>
          <PrimaryButton onClick={onOpenSavings}>{t.openSavings}</PrimaryButton>
        </div>
      )}
    </div>
  );
}
