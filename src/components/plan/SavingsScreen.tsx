/**
 * Savings: the Smart Spend & Save month. Before a plan, the salary split; after it,
 * what is left to spend, the split bar, the daily pace, a purchase check, moves from
 * savings (PIN) and the savings settings.
 */
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle } from "lucide-react";
import { cn } from "../../lib/utils";
import { fill, formatPkr } from "../market/helpers";
import { AnimatedPkr, Ripple } from "../market/motionParts";
import { PrimaryButton, SecondaryButton } from "../market/parts";
import { api, requestId, type PlanDashboard, type Verdict } from "./api";
import { PinPad, type PinOutcome } from "./PinPad";
import { SplitBar } from "./SplitBar";
import type { translations } from "../../translations";

type PlanLabels = (typeof translations)["en"]["plan"];

const field = "h-11 w-full rounded-xl border border-[var(--control)] bg-[var(--bg)] px-3 text-sm text-[var(--text-p)] placeholder:text-[var(--text-s)] focus:border-[var(--accent)] focus:outline-none";
const label = "mb-2 block text-[13px] font-medium text-[var(--text-p)]";
const rupees = (text: string) => parseFloat(String(text).replace(/[^\d.]/g, "")) || 0;

export function statusLine(d: PlanDashboard, t: PlanLabels) {
  const used = Math.floor(d.usedPct ?? 0);
  if ((d.over ?? 0) > 0) return { tone: "alert", text: fill(t.statusOver, { amount: formatPkr(d.over!) }) };
  if ((d.level ?? 0) >= 100) return { tone: "alert", text: t.statusUsedUp };
  if ((d.level ?? 0) >= 90) return { tone: "warn", text: fill(t.status90, { pct: used, left: formatPkr(d.remaining ?? 0) }) };
  if ((d.level ?? 0) >= 75) return { tone: "warn", text: fill(t.status75, { pct: used }) };
  if ((d.spent ?? 0) > 0) return { tone: "ok", text: fill(t.statusOnTrack, { pct: used }) };
  return { tone: "ok", text: t.statusNothing };
}

export const toneText = (tone: string) => (tone === "alert" ? "text-[var(--negative)]" : tone === "warn" ? "text-[var(--spend)]" : "text-[var(--positive)]");

export function SavingsScreen({ data, t, onChanged, onOpenDecision, notify }: {
  data: PlanDashboard; t: PlanLabels; onChanged: (d?: PlanDashboard) => void; onOpenDecision: () => void; notify: (m: string, type?: "success" | "error") => void;
}) {
  const [restarting, setRestarting] = useState(false);
  if (!data.plan || restarting) {
    return <Setup data={data} t={t} onStarted={d => { setRestarting(false); onChanged(d); }} onCancel={data.plan ? () => setRestarting(false) : undefined} />;
  }
  return <PlanView data={data} t={t} onChanged={onChanged} onOpenDecision={onOpenDecision} notify={notify} onNewMonth={() => setRestarting(true)} />;
}

function Setup({ data, t, onStarted, onCancel }: { data: PlanDashboard; t: PlanLabels; onStarted: (d: PlanDashboard) => void; onCancel?: () => void }) {
  const [deposit, setDeposit] = useState(String(data.suggestedDeposit ?? 100000));
  const [pct, setPct] = useState(60);
  const [flexible, setFlexible] = useState(true);
  const [floor, setFloor] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const amount = rupees(deposit);
  const preview = useMemo(() => amount > 0 ? {
    deposit: amount, pct, spendLimit: Math.round(amount * pct) / 100, savings: amount - Math.round(amount * pct) / 100, flexible,
    floor: rupees(floor) || null, transferred: 0, startedAt: "", monthLabel: "", daysInMonth: 30, startDay: 1,
  } : null, [amount, pct, flexible, floor]);

  const start = async () => {
    setBusy(true);
    const res = await api<PlanDashboard>("POST", "/api/plan/start", { deposit, pct, flexible, floor: floor.trim() || null });
    setBusy(false);
    if (!res.ok) return setError(res.body.message || "Could not start the month");
    onStarted(res.body);
  };

  return (
    <section className="space-y-5">
      <div>
        <h3 className="text-xl font-semibold tracking-tight text-[var(--text-p)]">{t.setupTitle}</h3>
        <p className="mt-1 text-sm text-[var(--text-s)]">{t.setupLede}</p>
      </div>
      <label className="block">
        <span className={label}>{t.amountReceived}</span>
        <div className="relative"><span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-sm text-[var(--text-s)]">PKR</span>
          <input inputMode="decimal" value={deposit} onChange={e => setDeposit(e.target.value)} className={cn(field, "ps-12 text-lg font-semibold")} /></div>
      </label>
      <label className="block">
        <span className={label}>{t.spendShare}</span>
        <input type="range" min={10} max={90} step={5} value={pct} onChange={e => setPct(Number(e.target.value))} className="w-full accent-[var(--spend)]" aria-describedby="split-out" />
        <p id="split-out" className="tabular mt-1 text-sm text-[var(--text-p)]">
          {preview ? fill(t.splitOut, { pct, spend: formatPkr(preview.spendLimit), save: 100 - pct, savings: formatPkr(preview.savings) }) : `${pct}%`}
        </p>
      </label>
      {preview && <SplitBar plan={preview} spent={0} t={t} size="sm" />}
      <fieldset>
        <legend className={label}>{t.savingsAre}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {[{ v: false, title: t.protected, desc: t.protectedDesc }, { v: true, title: t.flexible, desc: t.flexibleDesc }].map(o => (
            <label key={String(o.v)} className={cn("flex cursor-pointer gap-3 rounded-2xl border p-3 transition-colors", flexible === o.v ? "border-[var(--accent)] bg-[var(--raised)]" : "border-[var(--control)]")}>
              <input type="radio" name="setup-mode" checked={flexible === o.v} onChange={() => setFlexible(o.v)} className="mt-1 accent-[var(--accent)]" />
              <span><b className="block text-sm font-semibold text-[var(--text-p)]">{o.title}</b><small className="text-[13px] text-[var(--text-s)]">{o.desc}</small></span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block">
        <span className={label}>{t.floorLabel}</span>
        <input inputMode="decimal" value={floor} onChange={e => setFloor(e.target.value)} placeholder={t.noFloor} className={field} />
      </label>
      {error && <p className="text-sm text-[var(--negative)]">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <PrimaryButton className="flex-1" disabled={busy || !(amount > 0)} onClick={start}>{busy ? <Ripple size={22} /> : t.startMonth}</PrimaryButton>
        {onCancel && <SecondaryButton onClick={onCancel}>{t.back}</SecondaryButton>}
      </div>
    </section>
  );
}

function PlanView({ data, t, onChanged, onOpenDecision, notify, onNewMonth }: {
  data: PlanDashboard; t: PlanLabels; onChanged: (d?: PlanDashboard) => void; onOpenDecision: () => void; notify: (m: string, type?: "success" | "error") => void; onNewMonth: () => void;
}) {
  const plan = data.plan!;
  const status = statusLine(data, t);

  return (
    <div className="space-y-6">
      {data.pending && (
        <motion.button
          type="button"
          onClick={onOpenDecision}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex w-full items-start gap-3 rounded-2xl border border-[var(--negative)] bg-[var(--negative)]/10 p-4 text-start"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-none text-[var(--negative)]" />
          <span><b className="block text-sm font-semibold text-[var(--negative)]">{t.limitTitle}</b><span className="text-[13px] text-[var(--text-p)]">{t.limitBanner}</span></span>
        </motion.button>
      )}

      <section aria-live="polite">
        <p className="text-[13px] font-medium text-[var(--text-s)]">{t.leftToSpend} · {plan.monthLabel}</p>
        <p className="mt-1 text-4xl font-semibold tracking-tight text-[var(--text-p)]"><AnimatedPkr value={data.remaining ?? 0} /></p>
        <p className={cn("mt-1 text-sm font-semibold", toneText(status.tone))}>{status.text}</p>
      </section>

      <SplitBar plan={plan} spent={data.spent ?? 0} t={t} />

      <dl className="tabular grid grid-cols-3 gap-3 text-sm">
        {[
          [t.budgetFact, formatPkr(plan.spendLimit), fill(t.originalBudget, { amount: formatPkr(plan.spendLimit - plan.transferred) })],
          [t.savingsFact, formatPkr(plan.savings), plan.flexible ? t.flexible : t.protected],
          [t.movedFact, formatPkr(plan.transferred), plan.floor != null ? fill(t.floor, { amount: formatPkr(plan.floor) }) : t.noFloor],
        ].map(([k, v, s]) => (
          <div key={k} className="rounded-2xl bg-[var(--raised)] p-3">
            <dt className="text-[12px] text-[var(--text-s)]">{k}</dt>
            <dd className="mt-0.5 font-semibold text-[var(--text-p)]">{v}</dd>
            <small className="text-[12px] text-[var(--text-s)]">{s}</small>
          </div>
        ))}
      </dl>

      {data.pace && (
        <p className="rounded-2xl bg-[var(--raised)] p-4 text-sm">
          <b className="block font-semibold text-[var(--text-p)]">{data.pace.head}</b>
          <span className="text-[var(--text-s)]">{data.pace.sub}</span>
        </p>
      )}

      <AffordabilityCheck t={t} />
      {plan.flexible && <MoveFromSavings data={data} t={t} onMoved={d => { notify(t.done); onChanged(d); }} />}
      <Settings data={data} t={t} onChanged={onChanged} onNewMonth={onNewMonth} />
    </div>
  );
}

function AffordabilityCheck({ t }: { t: PlanLabels }) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<Verdict | null>(null);
  const [error, setError] = useState("");
  const check = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api<Verdict>("POST", "/api/plan/check", { text });
    if (!res.ok) { setResult(null); return setError(res.body.message || ""); }
    setError("");
    setResult(res.body);
  };
  return (
    <section>
      <h4 className="text-[15px] font-semibold text-[var(--text-p)]">{t.askTitle}</h4>
      <p className="text-[13px] text-[var(--text-s)]">{t.askSub}</p>
      <form onSubmit={check} className="mt-3 flex gap-2">
        <label className="sr-only" htmlFor="ask-input">{t.askTitle}</label>
        <input id="ask-input" value={text} onChange={e => setText(e.target.value)} placeholder={t.askPlaceholder} className={field} />
        <PrimaryButton type="submit" className="h-11">{t.check}</PrimaryButton>
      </form>
      {error && <p className="mt-2 text-sm text-[var(--negative)]">{error}</p>}
      <AnimatePresence mode="wait">
        {result && (
          <motion.div key={result.verdict + result.lines[0]} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 rounded-2xl bg-[var(--raised)] p-4 text-sm">
            <p className={cn("font-semibold", toneText(result.tone))}>{result.verdict}</p>
            {result.lines.map(l => <p key={l} className="tabular mt-1 text-[var(--text-p)]">{l}</p>)}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

type Preview = { amount: number; savingsAfter: number; spendLimitAfter: number; remainingAfter: number; belowFloor: boolean };

/** The amount, a live preview and the floor warning, then the PIN */
export function MoveFromSavings({ data, t, onMoved }: { data: PlanDashboard; t: PlanLabels; onMoved: (d: PlanDashboard) => void }) {
  const plan = data.plan!;
  const [amount, setAmount] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState("");
  const [pinOpen, setPinOpen] = useState(false);
  const max = Math.floor(plan.savings / 500) * 500;
  const chips = [...((data.over ?? 0) > 0 && data.over! <= plan.savings ? [Math.ceil(data.over!)] : []), 2000, 5000, 10000].filter(c => c <= plan.savings);

  useEffect(() => {
    if (!rupees(amount)) { setPreview(null); setError(""); return; }
    const timer = setTimeout(async () => {
      const res = await api<Preview>("POST", "/api/plan/preview-move", { amount });
      if (res.ok) { setPreview(res.body); setError(""); } else { setPreview(null); setError(res.body.message || ""); }
    }, 200);
    return () => clearTimeout(timer);
  }, [amount, plan.savings]);

  const submit = async (pin: string): Promise<PinOutcome> => {
    const res = await api<{ message: string; dashboard: PlanDashboard }>("POST", "/api/plan/move", { amount, pin, requestId: requestId() });
    if (res.ok) { setPinOpen(false); setAmount(""); onMoved(res.body.dashboard); return { ok: true }; }
    return { ok: false, message: res.body.message || "", locked: res.body.pinError === "locked" };
  };

  if (pinOpen && preview) return <PinPad what={`${t.moving} ${formatPkr(preview.amount)}`} t={t} onSubmit={submit} onBack={() => setPinOpen(false)} />;

  return (
    <section>
      <h4 className="text-[15px] font-semibold text-[var(--text-p)]">{t.moveTitle}</h4>
      <p className="text-[13px] text-[var(--text-s)]">{t.moveLede}</p>
      <div className="mt-3">
        <SplitBar plan={plan} spent={data.spent ?? 0} t={t} size="lg" moving={preview?.amount ?? 0} belowFloor={preview?.belowFloor} />
        <input
          type="range" min={0} max={max} step={500} value={Math.min(rupees(amount), max)}
          onChange={e => setAmount(e.target.value === "0" ? "" : e.target.value)}
          aria-label={t.amountToMove} disabled={max === 0}
          className="mt-3 w-full accent-[var(--save)]"
        />
      </div>
      <label className="mt-3 block">
        <span className={label}>{t.amountToMove}</span>
        <input inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="5,000" className={field} />
      </label>
      <div className="mt-2 flex flex-wrap gap-2">
        {chips.map((c, i) => (
          <button key={c} type="button" onClick={() => setAmount(String(c))} className="tabular rounded-full border border-[var(--control)] px-3 py-1.5 text-[13px] text-[var(--text-p)] hover:border-[var(--accent)]">
            {i === 0 && (data.over ?? 0) > 0 && c === Math.ceil(data.over!) ? t.coverOverspend : formatPkr(c)}
          </button>
        ))}
      </div>
      <dl className="tabular mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        {[[t.moving, preview?.amount], [t.savingsAfter, preview?.savingsAfter], [t.newBudget, preview?.spendLimitAfter], [t.leftAfter, preview?.remainingAfter]].map(([k, v]) => (
          <div key={k as string} className="flex justify-between gap-2"><dt className="text-[var(--text-s)]">{k}</dt><dd className="text-[var(--text-p)]">{v == null ? "—" : formatPkr(v as number)}</dd></div>
        ))}
      </dl>
      {preview?.belowFloor && <p className="mt-2 text-sm text-[var(--spend)]">{fill(t.belowFloor, { amount: formatPkr(plan.floor ?? 0) })}</p>}
      {error && <p className="mt-2 text-sm text-[var(--negative)]">{error}</p>}
      <PrimaryButton className="mt-4 w-full" disabled={!preview} onClick={() => setPinOpen(true)}>{t.confirmPin}</PrimaryButton>
    </section>
  );
}

function Settings({ data, t, onChanged, onNewMonth }: { data: PlanDashboard; t: PlanLabels; onChanged: (d?: PlanDashboard) => void; onNewMonth: () => void }) {
  const plan = data.plan!;
  const [floor, setFloor] = useState(plan.floor == null ? "" : String(plan.floor));
  const [error, setError] = useState("");
  const save = async (patch: Record<string, unknown>) => {
    const res = await api<PlanDashboard>("PUT", "/api/plan/settings", patch);
    if (!res.ok) return setError(res.body.message || "");
    setError("");
    onChanged(res.body);
  };
  return (
    <section className="border-t border-[var(--border)] pt-5">
      <h4 className="text-[15px] font-semibold text-[var(--text-p)]">{t.settingsTitle}</h4>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {[{ v: false, title: t.protected, desc: t.protectedDesc }, { v: true, title: t.flexible, desc: t.flexibleDesc }].map(o => (
          <label key={String(o.v)} className={cn("flex cursor-pointer gap-3 rounded-2xl border p-3 transition-colors", plan.flexible === o.v ? "border-[var(--accent)] bg-[var(--raised)]" : "border-[var(--control)]")}>
            <input type="radio" name="plan-mode" checked={plan.flexible === o.v} onChange={() => save({ flexible: o.v })} className="mt-1 accent-[var(--accent)]" />
            <span><b className="block text-sm font-semibold text-[var(--text-p)]">{o.title}</b><small className="text-[13px] text-[var(--text-s)]">{o.desc}</small></span>
          </label>
        ))}
      </div>
      <label className="mt-4 block">
        <span className={label}>{t.floorLabel}</span>
        <div className="flex gap-2">
          <input inputMode="decimal" value={floor} onChange={e => setFloor(e.target.value)} placeholder={t.noFloor} className={field} aria-describedby="floor-help" />
          <SecondaryButton className="h-11 flex-none" onClick={() => save({ floor: floor.trim() || null })}>{t.saveFloor}</SecondaryButton>
        </div>
      </label>
      <p id="floor-help" className="mt-1 text-[13px] text-[var(--text-s)]">{t.floorHelp}</p>
      {error && <p className="mt-2 text-sm text-[var(--negative)]">{error}</p>}
      <SecondaryButton className="mt-5 w-full" onClick={onNewMonth}>{t.newMonth}</SecondaryButton>
    </section>
  );
}
