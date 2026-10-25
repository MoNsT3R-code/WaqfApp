/**
 * Money Helper (Smart Advisor): a LangGraph pipeline that grounds its suggestion in the
 * user's own transactions and in the FAQ's budgeting guidance.
 *
 *   START -> analyze -> retrieve -> advise -> END
 */
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { FaqKnowledgeBase, type ScoredDocument } from "./knowledge.ts";
import { LANGUAGE_NAMES, generateWithLocalModel } from "./llm.ts";

export type LedgerEntry = { amount: number; category: string; merchant: string; date: string };

type SpendingStats = {
  balance: number;
  income: number;
  spending: number;
  loanTotal: number;
  byCategory: [string, number][];
  focus: string;
};

const AdvisorState = Annotation.Root({
  transactions: Annotation<LedgerEntry[]>,
  balance: Annotation<number>,
  lang: Annotation<string>,
  stats: Annotation<SpendingStats>,
  guidance: Annotation<ScoredDocument | null>,
  insight: Annotation<string>,
  generatedBy: Annotation<"local-model" | "extractive">,
});
type State = typeof AdvisorState.State;

// Which FAQ entry holds the guidance for each focus of the advice
const FOCUS_QUERY: Record<string, string> = {
  negative: "What warning signs in my spending should I watch for?",
  loan: "When is borrowing a reasonable choice?",
  Bills: "How do I reduce spending on bills?",
  Food: "How do I reduce spending on food?",
  "Food & Drink": "How do I reduce spending on food?",
  Travel: "How should I save for Umrah or another big trip?",
  none: "How can WaqfApp help me budget?",
};
const DEFAULT_QUERY = "What is a simple budgeting method I can follow?";

// Used when the retrieved guidance has no short, actionable sentence to quote
const FALLBACK_ACTION: Record<string, string> = {
  negative: "Pause non-essential spending and plan the rest of the month around your essential bills until the balance is positive again.",
  loan: "Keep Quick Loans for genuine emergencies and plan to repay from your next income before borrowing again.",
  none: "Record your cash spending with Add Cash so the Money Helper can give you more specific advice.",
};
const DEFAULT_ACTION = "Try dividing take-home income into needs, wants and at least a fifth for saving and giving, setting your giving aside first.";

const ACTION_START = /^(Pay|Plan|Decide|Keep|Choose|Watch|Ask|Make|Start|Set|Use|Treat|Reduce|Check|Compare|Record|Before|Try|Review)\b/;

const pkr = (n: number) => `PKR ${Math.round(n).toLocaleString("en-US")}`;

export function buildAdvisorGraph(kb: FaqKnowledgeBase) {
  const analyze = async (state: State) => {
    const txs = state.transactions;
    const income = txs.filter(t => t.amount > 0 && t.category !== "Loan").reduce((s, t) => s + t.amount, 0);
    const loanTotal = txs.filter(t => t.category === "Loan").reduce((s, t) => s + t.amount, 0);
    const totals = new Map<string, number>();
    for (const t of txs.filter(t => t.amount < 0)) totals.set(t.category, (totals.get(t.category) || 0) - t.amount);
    const byCategory = [...totals.entries()].sort((a, b) => b[1] - a[1]);
    const spending = byCategory.reduce((s, [, v]) => s + v, 0);
    // The ledger is newest-first, so a loan among the last five entries counts as recent
    const recentLoan = txs.slice(0, 5).some(t => t.category === "Loan");

    const focus = state.balance < 0 ? "negative" : recentLoan ? "loan" : byCategory[0]?.[0] || "none";
    return { stats: { balance: state.balance, income, spending, loanTotal, byCategory, focus } };
  };

  const retrieve = async (state: State) => {
    const [best] = await kb.search(FOCUS_QUERY[state.stats.focus] || DEFAULT_QUERY, 1);
    return { guidance: best || null };
  };

  const advise = async (state: State) => {
    const { stats, guidance } = state;
    const [topCategory, topAmount] = stats.byCategory[0] || ["", 0];
    const share = stats.spending ? Math.round((topAmount / stats.spending) * 100) : 0;

    const finding =
      stats.focus === "negative" ? `Your balance is ${pkr(stats.balance)}, below zero, after ${pkr(stats.spending)} of recent spending.`
      : stats.focus === "loan" ? `You have drawn ${pkr(stats.loanTotal)} from Quick Loan, and your largest spending is ${topCategory} at ${pkr(topAmount)}.`
      : stats.focus === "none" ? `You have no recorded spending yet, and your balance is ${pkr(stats.balance)}.`
      : `${topCategory} is your largest spending category at ${pkr(topAmount)}, ${share}% of your recent spending of ${pkr(stats.spending)}.`;

    const generated = await generateWithLocalModel(
      `You are the WaqfApp Money Helper for a Pakistani digital wallet. Give exactly one practical suggestion in at most two sentences, ` +
      `in ${LANGUAGE_NAMES[state.lang] || "English"}, using only the figures and guidance provided. Amounts are in PKR. ` +
      `This is general guidance, not professional financial advice.`,
      `Figures: balance ${pkr(stats.balance)}; income ${pkr(stats.income)}; spending ${pkr(stats.spending)}; Quick Loan ${pkr(stats.loanTotal)}; ` +
      `spending by category: ${stats.byCategory.map(([c, v]) => `${c} ${pkr(v)}`).join(", ") || "none"}.\n` +
      `Key finding: ${finding}\nGuidance from the FAQ: ${guidance?.doc.metadata.answer || "none"}`
    );
    if (generated) return { insight: generated, generatedBy: "local-model" as const };

    const sentences = guidance?.doc.metadata.answer.split(/(?<=[.!?])\s+/) || [];
    const action = sentences.find(s => ACTION_START.test(s) && s.length <= 220)
      || FALLBACK_ACTION[stats.focus] || DEFAULT_ACTION;
    return { insight: `${finding} ${action}`, generatedBy: "extractive" as const };
  };

  return new StateGraph(AdvisorState)
    .addNode("analyze", analyze)
    .addNode("retrieve", retrieve)
    .addNode("advise", advise)
    .addEdge(START, "analyze")
    .addEdge("analyze", "retrieve")
    .addEdge("retrieve", "advise")
    .addEdge("advise", END)
    .compile();
}

export async function adviseOnSpending(
  graph: ReturnType<typeof buildAdvisorGraph>,
  input: { transactions: LedgerEntry[]; balance: number; lang: string }
) {
  const result = await graph.invoke(input);
  return {
    insight: result.insight,
    focus: result.stats.focus,
    source: result.guidance ? { question: result.guidance.doc.metadata.question, section: result.guidance.doc.metadata.section } : null,
    generatedBy: result.generatedBy,
  };
}
