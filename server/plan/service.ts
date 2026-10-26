/**
 * Smart Spend & Save, per user: the monthly plan, spending measured from the
 * user's own ledger since the month started, budget warnings at 75%, 90% and
 * 100%, the decision pipeline at the limit, and moves from savings. Every step is
 * written to the hash-chained audit log.
 */
import { audit } from "../security/audit.ts";
import type { FaqKnowledgeBase } from "../agent/knowledge.ts";
import { affordability, allocate, applyTransfer, pace, parseAmount, PlanError, pkr, previewTransfer, remaining, thresholdLevel, thresholdNotice, type Plan } from "./budget.ts";
import { buildDecisionGraph, Command } from "./decisionGraph.ts";

type Tx = { userId: string; amount: number; category: string; date: string };

export type Pending = { step: string; payload: Record<string, unknown> } | null;

export function createPlanService({ kb, transactionsOf }: { kb: FaqKnowledgeBase; transactionsOf: (userId: string) => Tx[] }) {
  const graph = buildDecisionGraph(kb);
  const plans = new Map<string, Plan>();
  const lastLevel = new Map<string, number>();
  const threads = new Map<string, string>();   // userId → thread of the decision waiting for them
  const pending = new Map<string, Pending>();
  let runs = 0;

  /** Spending since the month started: every payment out of the wallet, by category */
  const spending = (userId: string, plan: Plan) => {
    const categories: Record<string, number> = {};
    let spent = 0;
    for (const t of transactionsOf(userId)) {
      if (t.amount >= 0 || t.date < plan.startedAt) continue;
      spent += -t.amount;
      categories[t.category] = (categories[t.category] || 0) - t.amount;
    }
    return { spent: Math.round(spent * 100) / 100, categories };
  };

  const pendingFrom = (result: any): Pending => {
    const value = result?.__interrupt__?.[0]?.value;
    return value ? { step: value.step, payload: value } : null;
  };

  /** What the screens show: the plan, the figures that follow from it, and any waiting decision */
  function dashboard(userId: string) {
    const plan = plans.get(userId);
    if (!plan) return { plan: null };
    const { spent, categories } = spending(userId, plan);
    const now = new Date();
    return {
      plan,
      spent,
      remaining: remaining(spent, plan),
      over: Math.max(0, Math.round((spent - plan.spendLimit) * 100) / 100),
      level: thresholdLevel(spent, plan.spendLimit),
      usedPct: plan.spendLimit ? Math.round((spent * 1000) / plan.spendLimit) / 10 : 100,
      monthPct: Math.round((now.getDate() * 100) / plan.daysInMonth),
      pace: pace(plan, spent, now),
      categories,
      pending: pending.get(userId) ?? null,
    };
  }

  function start(userId: string, input: { deposit: unknown; pct: unknown; flexible: unknown; floor: unknown }) {
    const deposit = parseAmount(input.deposit) ?? NaN;
    const floor = input.floor === null || input.floor === "" || input.floor === undefined ? null : parseAmount(input.floor);
    const plan = allocate(deposit, Number(input.pct), input.flexible === true, floor);
    plans.set(userId, plan);
    lastLevel.set(userId, 0);
    pending.delete(userId);
    threads.delete(userId);
    audit(userId, "month_started", { deposit: pkr(plan.deposit), split: `${plan.pct}% spend, ${100 - plan.pct}% save`, savings: plan.flexible ? "flexible" : "protected", floor: plan.floor == null ? "none" : pkr(plan.floor) });
    return dashboard(userId);
  }

  async function settings(userId: string, patch: { flexible?: unknown; floor?: unknown }) {
    const plan = plans.get(userId);
    if (!plan) throw new PlanError("Start your month first.");
    const next = { ...plan };
    const shown: Record<string, string> = {};
    if (typeof patch.flexible === "boolean") { next.flexible = patch.flexible; shown.savings = patch.flexible ? "flexible" : "protected"; }
    if ("floor" in patch) {
      const floor = patch.floor === null || patch.floor === "" ? null : parseAmount(patch.floor);
      if (floor != null && floor < 0) throw new PlanError("The savings floor can't be negative.");
      next.floor = floor;
      shown.floor = floor == null ? "none" : pkr(floor);
    }
    plans.set(userId, next);
    audit(userId, "settings_changed", shown);
    // A decision that is waiting sees the new settings (for example savings switched to flexible)
    const thread = threads.get(userId);
    if (thread && pending.get(userId)) {
      const config = { configurable: { thread_id: thread } };
      await graph.updateState(config, { plan: next });
    }
    return dashboard(userId);
  }

  /**
   * After a payment: warn when spending crosses 75%, 90% or 100% of the budget, and
   * at 100% start the decision pipeline, which waits for the customer's choice.
   */
  async function afterSpend(userId: string) {
    const plan = plans.get(userId);
    if (!plan) return null;
    const { spent, categories } = spending(userId, plan);
    const level = thresholdLevel(spent, plan.spendLimit);
    const previous = lastLevel.get(userId) ?? 0;
    lastLevel.set(userId, level);
    const thread = threads.get(userId);
    if (thread && pending.get(userId)) {
      await graph.updateState({ configurable: { thread_id: thread } }, { spent, categories });
      return { level, notice: "", pending: pending.get(userId) };
    }
    if (level <= previous) return { level, notice: "", pending: null };
    audit(userId, "budget_threshold", { level, spent: pkr(spent), budget: pkr(plan.spendLimit) });
    if (level < 100) return { level, notice: thresholdNotice(level, spent, plan), pending: null };

    const threadId = `${userId}:${plan.startedAt}:${++runs}`;
    threads.set(userId, threadId);
    const result = await graph.invoke({ plan, spent, categories, level: 0, status: "", message: "", error: "", explanation: "", hits: [], choice: "", amount: null, back: false, reviewed: false }, { configurable: { thread_id: threadId } });
    const next = pendingFrom(result);
    pending.set(userId, next ? { ...next, payload: { ...next.payload, hits: result.hits } } : null);
    if (next) audit(userId, "decision_requested", { step: next.step });
    return { level, notice: thresholdNotice(level, spent, plan), pending: pending.get(userId) };
  }

  /** The customer's answer to the waiting step. Confirming a move needs the PIN, checked by the caller. */
  async function respond(userId: string, value: string) {
    const thread = threads.get(userId);
    const waiting = pending.get(userId);
    if (!thread || !waiting) throw new PlanError("No decision is waiting for a response.");
    const config = { configurable: { thread_id: thread } };
    const result: any = await graph.invoke(new Command({ resume: value }), config);
    const next = pendingFrom(result);
    audit(userId, "decision_submitted", { step: waiting.step, value: waiting.step === "ask_amount" ? pkr(parseAmount(value) ?? 0) : value, result: next ? `waiting:${next.step}` : result.status });
    if (next) {
      pending.set(userId, { ...next, payload: { ...next.payload, hits: result.hits } });
      return { status: "waiting", pending: pending.get(userId), dashboard: dashboard(userId) };
    }
    pending.set(userId, null);
    threads.delete(userId);
    if (result.status === "transferred") {
      plans.set(userId, result.plan);
      audit(userId, "savings_move_confirmed", { amount: pkr(result.amount), budget: pkr(result.plan.spendLimit), savings: pkr(result.plan.savings) });
      lastLevel.set(userId, thresholdLevel(spending(userId, result.plan).spent, result.plan.spendLimit));
    }
    return { status: result.status, message: result.message, dashboard: dashboard(userId) };
  }

  /** "Decide later": the decision stays waiting and can be reopened */
  const waitingStep = (userId: string) => pending.get(userId)?.step ?? null;

  /** Move savings into the budget outside the limit decision (Savings screen, Quick Loan alternative) */
  function moveSavings(userId: string, amountInput: unknown) {
    const plan = plans.get(userId);
    if (!plan) throw new PlanError("Start your month first.");
    const { spent } = spending(userId, plan);
    const preview = previewTransfer(plan, spent, parseAmount(amountInput) ?? NaN);
    const next = applyTransfer(plan, preview);
    plans.set(userId, next);
    lastLevel.set(userId, thresholdLevel(spent, next.spendLimit));
    audit(userId, "savings_move_confirmed", { amount: pkr(preview.amount), budget: pkr(next.spendLimit), savings: pkr(next.savings), belowFloor: preview.belowFloor });
    return { message: `Moved ${pkr(preview.amount)} from savings into your spending budget.`, dashboard: dashboard(userId) };
  }

  function previewMove(userId: string, amountInput: unknown) {
    const plan = plans.get(userId);
    if (!plan) throw new PlanError("Start your month first.");
    return previewTransfer(plan, spending(userId, plan).spent, parseAmount(amountInput) ?? NaN);
  }

  /** "Thinking of buying something?": the purchase checked against the budget */
  function check(userId: string, text: unknown) {
    const plan = plans.get(userId);
    if (!plan) throw new PlanError("Start your month first to check purchases against a budget.");
    const amount = parseAmount(text);
    if (amount == null || amount <= 0) throw new PlanError("Add a price, for example “Shoes 7,000”.");
    return { amount, ...affordability(plan, spending(userId, plan).spent, amount) };
  }

  /** Budget impact of a payment before it is made (Send Money, Bills) */
  function impact(userId: string, amount: number) {
    const plan = plans.get(userId);
    if (!plan || !(amount > 0)) return null;
    return affordability(plan, spending(userId, plan).spent, amount);
  }

  return { dashboard, start, settings, afterSpend, respond, waitingStep, moveSavings, previewMove, check, impact, hasPlan: (userId: string) => plans.has(userId) };
}

export type PlanService = ReturnType<typeof createPlanService>;
export { PlanError };
