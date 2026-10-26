/**
 * The decision pipeline that runs when the spending budget is used up, after the
 * Smart Spend & Save prototype: a LangGraph StateGraph that pauses (interrupt) for
 * the customer's choice, retrieves the relevant policies from the knowledge base,
 * and never moves money without an explicit, PIN-confirmed choice.
 *
 *   START → evaluate ─ below 100% ─────────────────────────────────────────► END
 *                    └ limit → retrieve → explain → ask_user ⇄ review
 *                                                  ├ stay → END
 *                                                  └ use savings → ask_amount → confirm ─┬ transfer_savings → END
 *                                                                                         └ cancelled → END
 */
import { Annotation, Command, END, MemorySaver, START, StateGraph, interrupt } from "@langchain/langgraph";
import type { FaqKnowledgeBase } from "../agent/knowledge.ts";
import { applyTransfer, breakdownText, limitMessage, parseAmount, PlanError, pkr, previewTransfer, thresholdLevel, thresholdNotice, type Plan } from "./budget.ts";

export type PolicyHit = { question: string; section: string; score: number };

const State = Annotation.Root({
  plan: Annotation<Plan>,
  spent: Annotation<number>,
  categories: Annotation<Record<string, number>>,
  level: Annotation<number>,
  status: Annotation<string>,
  message: Annotation<string>,
  error: Annotation<string>,
  explanation: Annotation<string>,
  hits: Annotation<PolicyHit[]>,
  choice: Annotation<string>,
  amount: Annotation<number | null>,
  back: Annotation<boolean>,
  reviewed: Annotation<boolean>,
});
type S = typeof State.State;

const OPTIONS_QUERY = "spending budget used up limit options use savings stay within budget review spending protected flexible savings floor";

export function buildDecisionGraph(kb: FaqKnowledgeBase) {
  const evaluate = async (s: S) => {
    const level = thresholdLevel(s.spent, s.plan.spendLimit);
    const notice = thresholdNotice(level, s.spent, s.plan);
    if (level < 100) return { level, status: "ok", message: notice || "Expense recorded.", error: "" };
    return { level, status: "limit_reached", message: "", error: "", back: false, reviewed: false };
  };

  // The policies behind the options, from the Smart Spend & Save section of the knowledge base
  const retrieve = async () => {
    const results = await kb.search(OPTIONS_QUERY, 4);
    return { hits: results.map(r => ({ question: r.doc.metadata.question, section: r.doc.metadata.section, score: Math.round(r.score * 1000) / 1000 })) };
  };

  const explain = async (s: S) => ({ explanation: limitMessage(s.plan, s.spent) });

  const options = (s: S) => (s.plan.flexible ? ["use_savings", "stay_within_budget", "review_spending"] : ["stay_within_budget", "review_spending"]);

  const askUser = async (s: S) => {
    const choice = interrupt({
      step: "ask_user",
      question: "Your spending limit is reached. What would you like to do?",
      options: options(s),
      explanation: s.explanation,
      review: s.reviewed ? breakdownText(s.categories) : "",
      error: s.error || "",
    }) as string;
    if (!options(s).includes(choice)) return { choice: "", error: `“${choice}” isn’t one of the options.`, back: false };
    return { choice, error: "", back: false };
  };

  const review = async () => ({ reviewed: true });

  const askAmount = async (s: S) => {
    const value = interrupt({
      step: "ask_amount",
      question: "How much would you like to move from savings to your spending budget?",
      savings: s.plan.savings,
      floor: s.plan.floor,
      over: Math.max(0, s.spent - s.plan.spendLimit),
      error: s.error || "",
    }) as string;
    if (value === "back") return { back: true, error: "", amount: null };
    try {
      const preview = previewTransfer(s.plan, s.spent, parseAmount(value) ?? NaN);
      return { amount: preview.amount, error: "", back: false };
    } catch (e) {
      if (!(e instanceof PlanError)) throw e;
      return { amount: null, error: e.message, back: false };
    }
  };

  const confirm = async (s: S) => {
    let preview;
    try { preview = previewTransfer(s.plan, s.spent, s.amount ?? NaN); }
    catch (e) {
      if (!(e instanceof PlanError)) throw e;
      return { choice: "cancel", error: e.message };
    }
    const value = interrupt({
      step: "confirm",
      question: "Please confirm this move.",
      amount: preview.amount,
      savingsAfter: preview.savingsAfter,
      spendLimitAfter: preview.spendLimitAfter,
      remainingAfter: preview.remainingAfter,
      belowFloor: preview.belowFloor,
      floor: s.plan.floor,
      options: ["confirm", "cancel"],
    }) as string;
    return { choice: value === "confirm" ? "confirm" : "cancel", error: "" };
  };

  const transferSavings = async (s: S) => {
    try {
      const preview = previewTransfer(s.plan, s.spent, s.amount ?? NaN);
      const plan = applyTransfer(s.plan, preview);
      return {
        plan,
        status: "transferred",
        message: `Moved ${pkr(preview.amount)} from savings into your spending budget. New spending budget: ${pkr(plan.spendLimit)}. Savings: ${pkr(plan.savings)}.`,
      };
    } catch (e) {
      if (!(e instanceof PlanError)) throw e;
      return { status: "blocked", message: e.message };
    }
  };

  const stay = async () => ({ status: "stayed", message: "Your savings stay untouched. Keep spending within your current budget." });
  const cancelled = async (s: S) => ({ status: "cancelled", message: s.error ? `Move cancelled. ${s.error}` : "Move cancelled. Your savings are unchanged." });

  return new StateGraph(State)
    .addNode("evaluate", evaluate)
    .addNode("retrieve", retrieve)
    .addNode("explain", explain)
    .addNode("ask_user", askUser)
    .addNode("review", review)
    .addNode("ask_amount", askAmount)
    .addNode("confirm", confirm)
    .addNode("transfer_savings", transferSavings)
    .addNode("stay", stay)
    .addNode("cancelled", cancelled)
    .addEdge(START, "evaluate")
    .addConditionalEdges("evaluate", (s: S) => (s.status === "limit_reached" ? "retrieve" : END), ["retrieve", END])
    .addEdge("retrieve", "explain")
    .addEdge("explain", "ask_user")
    .addConditionalEdges("ask_user", (s: S) => (s.error ? "ask_user" : s.choice === "use_savings" ? "ask_amount" : s.choice === "stay_within_budget" ? "stay" : "review"), ["ask_user", "ask_amount", "stay", "review"])
    .addEdge("review", "ask_user")
    .addConditionalEdges("ask_amount", (s: S) => (s.back ? "ask_user" : s.error ? "ask_amount" : "confirm"), ["ask_user", "ask_amount", "confirm"])
    .addConditionalEdges("confirm", (s: S) => (s.choice === "confirm" ? "transfer_savings" : "cancelled"), ["transfer_savings", "cancelled"])
    .addEdge("transfer_savings", END)
    .addEdge("stay", END)
    .addEdge("cancelled", END)
    .compile({ checkpointer: new MemorySaver() });
}

export type DecisionGraph = ReturnType<typeof buildDecisionGraph>;
export { Command };
