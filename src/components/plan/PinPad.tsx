/**
 * PIN entry for money that leaves the budget. Four dots, a keypad, and typing on a
 * keyboard. The server checks the PIN; this only collects it.
 */
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Delete } from "lucide-react";
import { cn } from "../../lib/utils";
import { fill } from "../market/helpers";
import { Ripple } from "../market/motionParts";
import type { translations } from "../../translations";

type PlanLabels = (typeof translations)["en"]["plan"];
export type PinOutcome = { ok: true } | { ok: false; message: string; locked?: boolean };

export function PinPad({ what, t, onSubmit, onBack }: {
  what: string; t: PlanLabels; onSubmit: (pin: string) => Promise<PinOutcome>; onBack: () => void;
}) {
  const reduce = useReducedMotion();
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(0);

  const press = (key: string) => {
    if (busy) return;
    if (key === "del") return setPin(p => p.slice(0, -1));
    setPin(p => (p.length < 4 ? p + key : p));
  };

  // Four digits: send them, then clear on a wrong PIN
  useEffect(() => {
    if (pin.length !== 4 || busy) return;
    setBusy(true);
    onSubmit(pin).then(outcome => {
      if (outcome.ok === true) return;
      setBusy(false);
      setPin("");
      setMessage(outcome.message);
      setShake(n => n + 1);
      if (outcome.locked) setTimeout(onBack, 1800);
    });
  }, [pin]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") press("del");
      else if (e.key === "Escape") onBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy]);

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

  return (
    <div className="mx-auto max-w-xs text-center">
      <h3 className="text-lg font-semibold text-[var(--text-p)]">{t.pinTitle}</h3>
      <p className="mt-1 text-sm text-[var(--text-s)]">{fill(t.pinFor, { what })}</p>

      <motion.div
        key={shake}
        role="img"
        aria-label={fill(t.pinDigits, { n: pin.length })}
        className="mt-6 flex justify-center gap-4"
        animate={shake && !reduce ? { x: [0, -10, 10, -6, 6, 0] } : undefined}
        transition={{ duration: 0.35 }}
      >
        {[0, 1, 2, 3].map(i => (
          <motion.span
            key={i}
            className={cn("h-3.5 w-3.5 rounded-full border-2 border-[var(--text-s)]", i < pin.length && "border-[var(--accent)] bg-[var(--accent)]")}
            animate={{ scale: i === pin.length - 1 && !reduce ? [1.4, 1] : 1 }}
          />
        ))}
      </motion.div>
      <p className="mt-3 min-h-5 text-sm text-[var(--negative)]" aria-live="assertive">{busy ? "" : message}</p>

      <div className="mt-2 grid grid-cols-3 gap-3">
        {keys.map((k, i) =>
          k === "" ? <span key={i} /> : (
            <motion.button
              key={i}
              type="button"
              whileTap={{ scale: 0.9 }}
              disabled={busy}
              onClick={() => press(k)}
              aria-label={k === "del" ? t.deleteDigit : k}
              className="tabular flex h-14 items-center justify-center rounded-2xl bg-[var(--raised)] text-xl font-medium text-[var(--text-p)] transition-colors hover:bg-[var(--border)] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            >
              {k === "del" ? <Delete className="h-5 w-5" /> : k}
            </motion.button>
          )
        )}
      </div>
      {busy && <div className="mt-4 flex justify-center"><Ripple size={28} label={t.pinTitle} /></div>}
      <p className="mt-4 text-[13px] text-[var(--text-s)]">{t.pinHint}</p>
      <button type="button" onClick={onBack} className="mt-2 text-sm text-[var(--text-s)] underline underline-offset-4 hover:text-[var(--text-p)]">{t.back}</button>
    </div>
  );
}
