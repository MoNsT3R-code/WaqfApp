/**
 * Security Center: BreachMirror AI's live status, the user's hash-chained audit log
 * and the rules the app enforces.
 */
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ExternalLink, Link2, Link2Off, ShieldCheck, ShieldAlert } from "lucide-react";
import { cn } from "../../lib/utils";
import { fill } from "../market/helpers";
import { Ripple } from "../market/motionParts";
import { api } from "./api";
import type { translations } from "../../translations";

type PlanLabels = (typeof translations)["en"]["plan"];
type Status =
  | { connected: true; url: string; checkedAt: string; health: { status: string; uptime: number; encryption: string; auditChain: string; rag: string } }
  | { connected: false; url: string; checkedAt: string; reason: string };
type Entry = { seq: number; at: string; event: string; details: Record<string, string | number | boolean | null> };
type Audit = { entries: Entry[]; chain: { valid: boolean; entries: number; brokenAtSeq?: number } };

const EVENT_LABELS: Record<string, string> = {
  payment: "Payment", money_in: "Money in", month_started: "Month started", settings_changed: "Savings settings changed",
  budget_threshold: "Budget warning", decision_requested: "Limit decision opened", decision_submitted: "Decision answered",
  savings_move_confirmed: "Savings moved", transfer_denied: "Move refused", pin_failed: "Wrong PIN", pin_locked: "PIN actions paused",
  assistant_redacted: "Secret removed from a chat message",
};

const uptime = (s: number) => (s >= 3600 ? `${Math.floor(s / 3600)} h ${Math.floor((s % 3600) / 60)} m` : `${Math.floor(s / 60)} m`);

export function SecurityCenter({ t }: { t: PlanLabels }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [audit, setAudit] = useState<Audit | null>(null);

  useEffect(() => {
    api<Status>("GET", "/api/security/breachmirror").then(r => setStatus(r.ok ? r.body : null));
    api<Audit>("GET", "/api/security/audit").then(r => setAudit(r.ok ? r.body : null));
  }, []);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-[var(--raised)] p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-[var(--text-p)]">{t.breachmirror}</h3>
          {status && (
            <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold", status.connected ? "bg-[var(--save-soft)] text-[var(--save)]" : "bg-[var(--border)] text-[var(--text-s)]")}>
              {status.connected ? <Link2 className="h-3.5 w-3.5" /> : <Link2Off className="h-3.5 w-3.5" />}
              {status.connected ? t.connected : t.notConnected}
            </span>
          )}
        </div>
        {!status && <div className="mt-4"><Ripple size={28} /></div>}
        {status?.connected && (
          <>
            <dl className="tabular mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-[12px] text-[var(--text-s)]">{t.bmAudit}</dt><dd className={cn("font-semibold", status.health.auditChain === "intact" ? "text-[var(--positive)]" : "text-[var(--negative)]")}>{status.health.auditChain}</dd></div>
              <div><dt className="text-[12px] text-[var(--text-s)]">{t.bmEncryption}</dt><dd className="text-[var(--text-p)]">{status.health.encryption}</dd></div>
              <div className="sm:col-span-2"><dt className="text-[12px] text-[var(--text-s)]">{t.bmRag}</dt><dd className="text-[var(--text-p)]">{status.health.rag} · {uptime(status.health.uptime)}</dd></div>
            </dl>
            <a href={status.url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--bg)] hover:opacity-90">
              {t.openBreachMirror} <ExternalLink className="h-4 w-4" />
            </a>
            <p className="mt-2 text-[13px] text-[var(--text-s)]">{t.bmKeys}</p>
          </>
        )}
        {status && status.connected === false && <p className="mt-3 text-sm text-[var(--text-s)]">{status.reason} <span className="tabular">({status.url})</span></p>}
      </section>

      <section>
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-base font-semibold text-[var(--text-p)]">{t.auditTitle}</h3>
          {audit && (
            <span className={cn("inline-flex items-center gap-1.5 text-[13px] font-medium", audit.chain.valid ? "text-[var(--positive)]" : "text-[var(--negative)]")}>
              {audit.chain.valid ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
              {audit.chain.valid ? fill(t.chainIntact, { n: audit.chain.entries }) : fill(t.chainBroken, { seq: audit.chain.brokenAtSeq ?? 0 })}
            </span>
          )}
        </div>
        {audit && audit.entries.length === 0 && <p className="mt-2 text-sm text-[var(--text-s)]">{t.noAudit}</p>}
        <ol className="mt-3 max-h-72 space-y-0 overflow-y-auto scrollbar-hide">
          {audit?.entries.map((e, i) => (
            <motion.li key={e.seq} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i, 10) * 0.025 }}
              className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 border-b border-[var(--border)] py-2.5 last:border-b-0">
              <time className="tabular text-[12px] text-[var(--text-s)]">{new Date(e.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</time>
              <div className="min-w-0">
                <p className="text-sm text-[var(--text-p)]">{EVENT_LABELS[e.event] || e.event}</p>
                {Object.keys(e.details).length > 0 && (
                  <p className="truncate text-[12px] text-[var(--text-s)]">{Object.entries(e.details).map(([k, v]) => `${k}: ${v}`).join(" · ")}</p>
                )}
              </div>
            </motion.li>
          ))}
        </ol>
      </section>

      <section>
        <h3 className="text-base font-semibold text-[var(--text-p)]">{t.rulesTitle}</h3>
        <ul className="mt-2 space-y-1.5 text-sm text-[var(--text-p)]">
          {[t.rule1, t.rule2, t.rule3, t.rule4, t.rule5].map(r => <li key={r} className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 flex-none text-[var(--accent)]" />{r}</li>)}
        </ul>
      </section>
    </div>
  );
}
