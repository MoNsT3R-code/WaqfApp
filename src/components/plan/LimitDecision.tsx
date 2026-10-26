/**
 * The spending-limit decision, driven by the server's LangGraph pipeline: each step
 * it pauses on (ask_user, ask_amount, confirm) is shown here, and the answer resumes
 * it. Confirming a move needs the PIN; nothing changes until the customer chooses.
 */
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BookOpen } from "lucide-react";
import { cn } from "../../lib/utils";
import { fill, formatPkr } from "../market/helpers";
import { Ripple } from "../market/motionParts";
import { PrimaryButton, SecondaryButton } from "../market/parts";
import { api, requestId, type PlanDashboard } from "./api";
import { PinPad, type PinOutcome } from "./PinPad";
import { SplitBar } from "./SplitBar";
import type { translations } from "../../translations";

type PlanLabels = (typeof translations)["en"]["plan"];
type Respond = { status: string; message?: string; pending?: PlanDashboard["pending"]; dashboard: PlanDashboard };

export function LimitDecision({ data, t, onChanged, onClose }: {
  data: PlanDashboard; t: PlanLabels; onChanged: (d: PlanDashboard) => void; onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [pinOpen, setPinOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const pending = data.pending;
  const plan = data.plan;

  useEffect(() => { setDraft(""); setPinOpen(false); }, [pending?.step]);

  const respond = async (value: string, pin?: string): Promise<{ ok: boolean; message?: string; locked?: boolean }> => {
    setBusy(true);
    const res = await api<Respond>("POST", "/api/plan/respond", { value, pin, requestId: requestId() });
    setBusy(false);
    if (!res.ok) return { ok: false, message: res.body.message, locked: res.body.pinError === "locked" };
    onChanged(res.body.dashboard);
    if (res.body.status !== "waiting") setResult(res.body.message || t.done);
    return { ok: true };
  };

  if (result) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5 text-center">
        <p className="text-sm leading-6 text-[var(--text-p)]">{result}</p>
        {plan && <SplitBar plan={plan} spent={data.spent ?? 0} t={t} size="sm" />}
        <PrimaryButton className="w-full" onClick={onClose}>{t.done}</PrimaryButton>
      </motion.div>
    );
  }
  if (!pending || !plan) return <p className="text-sm text-[var(--text-s)]">{t.statusNothing}</p>;

  const p = pending.payload;
  const hits: { question: string; section: string }[] = p.hits || [];

  return (
    <AnimatePresence mode="wait">
      <motion.div key={pending.step + (pinOpen ? "-pin" : "")} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-5">
        {pending.step === "ask_user" && (
          <>
            <p className="text-sm leading-6 text-[var(--text-p)]">{p.explanation}</p>
            <SplitBar plan={plan} spent={data.spent ?? 0} t={t} size="sm" />
            {p.error && <p className="text-sm text-[var(--negative)]">{p.error}</p>}
            {p.review && <CategoryList categories={data.categories || {}} t={t} />}
            <div className="grid gap-2">
              {p.options.includes("use_savings") && <Option title={t.useSavings} desc={t.useSavingsDesc} tone="save" disabled={busy} onClick={() => respond("use_savings")} />}
              <Option title={t.stay} desc={t.stayDesc} tone="neutral" disabled={busy} onClick={() => respond("stay_within_budget")} />
              {!p.review && <Option title={t.review} desc={t.reviewDesc} tone="neutral" disabled={busy} onClick={() => respond("review_spending")} />}
            </div>
            {!p.options.includes("use_savings") && <p className="text-[13px] text-[var(--text-s)]">{t.protectedNote}</p>}
            {hits.length > 0 && (
              <div className="rounded-2xl bg-[var(--raised)] p-4">
                <p className="flex items-center gap-2 text-[12px] font-semibold text-[var(--text-s)]"><BookOpen className="h-3.5 w-3.5" /> {t.policySources}</p>
                <ul className="mt-2 space-y-1 text-[13px] text-[var(--text-p)]">{hits.map((h, i) => <li key={h.question}>[{i + 1}] {h.question}</li>)}</ul>
              </div>
            )}
            <button type="button" onClick={onClose} className="mx-auto block text-sm text-[var(--text-s)] underline underline-offset-4 hover:text-[var(--text-p)]">{t.decideLater}</button>
          </>
        )}

        {pending.step === "ask_amount" && (
          <AmountStep data={data} t={t} draft={draft} setDraft={setDraft} error={p.error} busy={busy}
            onSubmit={() => respond(draft)} onBack={() => respond("back")} />
        )}

        {pending.step === "confirm" && !pinOpen && (
          <>
            <h3 className="text-lg font-semibold text-[var(--text-p)]">{t.checkMove}</h3>
            <dl className="tabular space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-[var(--text-s)]">{t.movingFromSavings}</dt><dd className="text-lg font-semibold text-[var(--text-p)]">{formatPkr(p.amount)}</dd></div>
              <div className="flex justify-between"><dt className="text-[var(--text-s)]">{t.savingsAfter}</dt><dd className="text-[var(--text-p)]">{formatPkr(p.savingsAfter)}</dd></div>
              <div className="flex justify-between"><dt className="text-[var(--text-s)]">{t.newBudget}</dt><dd className="text-[var(--text-p)]">{formatPkr(p.spendLimitAfter)}</dd></div>
              <div className="flex justify-between"><dt className="text-[var(--text-s)]">{t.leftAfter}</dt><dd className="text-[var(--text-p)]">{formatPkr(p.remainingAfter)}</dd></div>
            </dl>
            <SplitBar plan={plan} spent={data.spent ?? 0} t={t} size="md" moving={p.amount} belowFloor={p.belowFloor} />
            {p.belowFloor && <p className="text-sm text-[var(--spend)]">{fill(t.belowFloor, { amount: formatPkr(p.floor ?? 0) })}</p>}
            <div className="flex flex-wrap gap-3">
              <PrimaryButton className="flex-1" disabled={busy} onClick={() => setPinOpen(true)}>{t.confirmPin}</PrimaryButton>
              <SecondaryButton disabled={busy} onClick={() => respond("cancel")}>{t.cancelMove}</SecondaryButton>
            </div>
          </>
        )}

        {pending.step === "confirm" && pinOpen && (
          <PinPad what={`${t.moving} ${formatPkr(p.amount)}`} t={t} onBack={() => setPinOpen(false)}
            onSubmit={async (pin): Promise<PinOutcome> => {
              const r = await respond("confirm", pin);
              return r.ok ? { ok: true } : { ok: false, message: r.message || "", locked: r.locked };
            }} />
        )}
        {busy && pending.step !== "confirm" && <div className="flex justify-center"><Ripple size={28} /></div>}
      </motion.div>
    </AnimatePresence>
  );
}

function Option({ title, desc, tone, disabled, onClick }: { title: string; desc: string; tone: "save" | "neutral"; disabled: boolean; onClick: () => void }) {
  return (
    <motion.button
      type="button" disabled={disabled} onClick={onClick} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
      className={cn("rounded-2xl border p-4 text-start transition-colors disabled:opacity-50", tone === "save" ? "border-[var(--save)] bg-[var(--save-soft)]" : "border-[var(--control)] hover:bg-[var(--raised)]")}
    >
      <b className="block text-sm font-semibold text-[var(--text-p)]">{title}</b>
      <span className="text-[13px] text-[var(--text-s)]">{desc}</span>
    </motion.button>
  );
}

function AmountStep({ data, t, draft, setDraft, error, busy, onSubmit, onBack }: {
  data: PlanDashboard; t: PlanLabels; draft: string; setDraft: (v: string) => void; error?: string; busy: boolean; onSubmit: () => void; onBack: () => void;
}) {
  const plan = data.plan!;
  const amount = parseFloat(draft.replace(/[^\d.]/g, "")) || 0;
  const max = Math.floor(plan.savings / 500) * 500;
  const over = data.over ?? 0;
  const chips = [...(over > 0 && over <= plan.savings ? [Math.ceil(over)] : []), 2000, 5000, 10000].filter(c => c <= plan.savings);
  const savingsAfter = plan.savings - Math.min(amount, plan.savings);
  const belowFloor = plan.floor != null && savingsAfter < plan.floor;

  return (
    <>
      <h3 className="text-lg font-semibold text-[var(--text-p)]">{t.moveTitle}</h3>
      <p className="text-[13px] text-[var(--text-s)]">{t.moveLede}</p>
      <SplitBar plan={plan} spent={data.spent ?? 0} t={t} size="lg" moving={amount} belowFloor={belowFloor} />
      <input type="range" min={0} max={max} step={500} value={Math.min(amount, max)} onChange={e => setDraft(e.target.value === "0" ? "" : e.target.value)} aria-label={t.amountToMove} className="w-full accent-[var(--save)]" />
      <label className="block">
        <span className="mb-2 block text-[13px] font-medium text-[var(--text-p)]">{t.amountToMove}</span>
        <input inputMode="decimal" value={draft} onChange={e => setDraft(e.target.value)} placeholder="5,000" className="h-11 w-full rounded-xl border border-[var(--control)] bg-[var(--bg)] px-3 text-sm text-[var(--text-p)] focus:border-[var(--accent)] focus:outline-none" />
      </label>
      <div className="flex flex-wrap gap-2">
        {chips.map((c, i) => (
          <button key={c} type="button" onClick={() => setDraft(String(c))} className="tabular rounded-full border border-[var(--control)] px-3 py-1.5 text-[13px] text-[var(--text-p)] hover:border-[var(--accent)]">
            {i === 0 && over > 0 && c === Math.ceil(over) ? t.coverOverspend : formatPkr(c)}
          </button>
        ))}
      </div>
      {belowFloor && amount > 0 && <p className="text-sm text-[var(--spend)]">{fill(t.belowFloor, { amount: formatPkr(plan.floor ?? 0) })}</p>}
      {error && <p className="text-sm text-[var(--negative)]">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <PrimaryButton className="flex-1" disabled={busy || !(amount > 0)} onClick={onSubmit}>{t.reviewMove}</PrimaryButton>
        <SecondaryButton disabled={busy} onClick={onBack}>{t.backToOptions}</SecondaryButton>
      </div>
    </>
  );
}

/** Spending by category, largest first, each with its share */
export function CategoryList({ categories, t }: { categories: Record<string, number>; t: PlanLabels }) {
  const rows = Object.entries(categories).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  if (!rows.length) return <p className="text-sm text-[var(--text-s)]">{t.noSpending}</p>;
  const max = rows[0][1];
  const total = rows.reduce((s, [, v]) => s + v, 0);
  return (
    <div>
      <h4 className="text-[15px] font-semibold text-[var(--text-p)]">{t.whereMoneyWent}</h4>
      <ul className="mt-2 space-y-2.5">
        {rows.map(([name, value]) => (
          <li key={name} className="text-sm">
            <div className="tabular flex justify-between gap-3"><span className="text-[var(--text-p)]">{name}</span><span className="text-[var(--text-p)]">{formatPkr(value)}<small className="ms-2 text-[var(--text-s)]">{Math.round((value * 100) / total)}%</small></span></div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--border)]">
              <motion.div className="h-full rounded-full bg-[var(--spend)]" initial={{ width: 0 }} animate={{ width: `${(value * 100) / max}%` }} transition={{ type: "spring", stiffness: 120, damping: 22 }} />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[13px] text-[var(--text-s)]">{fill(t.biggest, { category: rows[0][0], pct: Math.round((rows[0][1] * 100) / total) })}</p>
    </div>
  );
}
