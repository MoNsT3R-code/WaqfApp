/**
 * Client for the Smart Spend & Save, PIN and Security Center routes.
 */

export type Plan = {
  deposit: number; pct: number; spendLimit: number; savings: number; flexible: boolean; floor: number | null;
  transferred: number; startedAt: string; monthLabel: string; daysInMonth: number; startDay: number;
};

export type Pending = { step: "ask_user" | "ask_amount" | "confirm"; payload: Record<string, any> } | null;

export type PlanDashboard = {
  plan: Plan | null;
  spent?: number; remaining?: number; over?: number; level?: number; usedPct?: number; monthPct?: number;
  pace?: { perDay: number; daysLeft: number; head: string; sub: string };
  categories?: Record<string, number>;
  pending?: Pending;
  suggestedDeposit?: number;
};

export type Budget = { level: number; notice: string; pending: Pending } | null;
export type Verdict = { tone: "ok" | "warn" | "alert"; verdict: string; lines: string[] };

export type ApiResult<T = any> = { ok: boolean; status: number; body: T & { message?: string; pinError?: "missing" | "wrong" | "locked"; triesLeft?: number } };

const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("waqf_token")}` });

export async function api<T = any>(method: string, path: string, body?: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(path, { method, headers: headers(), body: body === undefined ? undefined : JSON.stringify(body) });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, body: json };
  } catch {
    return { ok: false, status: 0, body: { message: "System interruption" } as any };
  }
}

/** One number per confirmation, so a double tap or a retry is answered once */
export const requestId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
