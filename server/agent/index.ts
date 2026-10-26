/**
 * WaqfApp agents: RAG over docs/faq with LangChain + LangGraph, no API key required.
 */
import path from "path";
import { FaqKnowledgeBase } from "./knowledge.ts";
import { buildSupportGraph, answerQuestion, type ChatTurn } from "./supportGraph.ts";
import { buildAdvisorGraph, adviseOnSpending, type LedgerEntry } from "./advisorGraph.ts";
import { OLLAMA_MODEL } from "./llm.ts";

export function createAgents(rootDir: string) {
  // The FAQ, plus BreachMirror AI's security policies (docs/policies, from npm run policies:import)
  const kb = new FaqKnowledgeBase([path.join(rootDir, "docs", "faq"), path.join(rootDir, "docs", "policies")]);
  const supportGraph = buildSupportGraph(kb);
  const advisorGraph = buildAdvisorGraph(kb);

  return {
    kb,
    status: () => ({ ...kb.status(), localModel: OLLAMA_MODEL || null }),
    chat: (question: string, history: ChatTurn[], lang: string) => answerQuestion(supportGraph, { question, history, lang }),
    advise: (transactions: LedgerEntry[], balance: number, lang: string) => adviseOnSpending(advisorGraph, { transactions, balance, lang }),
  };
}

export type { ChatTurn, LedgerEntry };
