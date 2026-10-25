/**
 * Help Center assistant: a LangGraph RAG pipeline over the FAQ knowledge base.
 *
 *   START -> contextualize -> retrieve -> grade --relevant--> generate -> END
 *                                              \--none-----> fallback -> END
 */
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { ARABIC_SCRIPT, CROSS_LINGUAL_THRESHOLD, FaqKnowledgeBase, MIN_KEYWORD_COVERAGE, RELEVANCE_THRESHOLD, type ScoredDocument } from "./knowledge.ts";
import { LANGUAGE_NAMES, generateWithLocalModel } from "./llm.ts";

export type ChatTurn = { role: "user" | "ai"; content: string };
export type AnswerSource = { question: string; section: string };

const SupportState = Annotation.Root({
  question: Annotation<string>,
  history: Annotation<ChatTurn[]>,
  lang: Annotation<string>,
  query: Annotation<string>,
  context: Annotation<string | undefined>,
  candidates: Annotation<ScoredDocument[]>,
  relevant: Annotation<ScoredDocument[]>,
  answer: Annotation<string>,
  generatedBy: Annotation<"local-model" | "extractive" | "none">,
});
type State = typeof SupportState.State;

const TEXT = {
  en: {
    notFound: "I couldn't find that in the WaqfApp FAQ. Try asking with the name of the feature, for example \"How do I pay a bill?\" or \"What is the Quick Loan limit?\". If the FAQ doesn't cover it, please tell the team through the Feedback button.",
    related: "Related questions:",
    note: "",
  },
  ur: {
    notFound: "مجھے یہ سوال WaqfApp کے FAQ میں نہیں ملا۔ براہ کرم فیچر کا نام لے کر دوبارہ پوچھیں، مثلاً \"بل کیسے ادا کروں؟\"۔ اگر FAQ میں اس کا جواب نہیں ہے تو Feedback بٹن کے ذریعے ٹیم کو بتائیں۔",
    related: "متعلقہ سوالات:",
    note: "(یہ جواب انگریزی FAQ سے لیا گیا ہے)\n\n",
  },
  ar: {
    notFound: "لم أجد هذا السؤال في الأسئلة الشائعة لتطبيق WaqfApp. حاول السؤال باسم الميزة، مثل \"كيف أدفع فاتورة؟\". إذا لم تغطه الأسئلة الشائعة، فأخبر الفريق عبر زر الملاحظات.",
    related: "أسئلة ذات صلة:",
    note: "(هذه الإجابة مأخوذة من الأسئلة الشائعة باللغة الإنجليزية)\n\n",
  },
} as const;

const textFor = (lang: string) => TEXT[lang as keyof typeof TEXT] || TEXT.en;

const FOLLOW_UP = /^(and|also|what about|how about|then|so|but|it|that|this|اور|کیا|و|ماذا عن)\b/i;

export function buildSupportGraph(kb: FaqKnowledgeBase) {
  // A short follow-up ("and the limit?") carries over the topic of the previous question
  const contextualize = async (state: State) => {
    const previous = [...(state.history || [])].reverse().find(t => t.role === "user")?.content;
    const words = state.question.trim().split(/\s+/).length;
    const isFollowUp = previous && (words <= 5 || FOLLOW_UP.test(state.question.trim()));
    return { query: state.question, context: isFollowUp ? previous : undefined };
  };

  const retrieve = async (state: State) => ({ candidates: await kb.search(state.query, 5, state.context) });

  // Keeps only entries that clear the relevance threshold, and ones close to the best match
  const grade = async (state: State) => {
    const crossLingual = kb.mode === "embeddings" && ARABIC_SCRIPT.test(state.question);
    const threshold = crossLingual ? CROSS_LINGUAL_THRESHOLD : RELEVANCE_THRESHOLD[kb.mode];
    const best = state.candidates[0]?.score ?? 0;
    const margin = kb.mode === "embeddings" ? 0.12 : best * 0.4;
    const relevant = state.candidates
      .filter(c => c.score >= threshold && c.score >= best - margin)
      .filter(c => kb.mode === "embeddings" || (c.coverage ?? 0) >= MIN_KEYWORD_COVERAGE)
      .slice(0, 3);
    return { relevant };
  };

  const generate = async (state: State) => {
    const context = state.relevant
      .map((r, i) => `[${i + 1}] Q: ${r.doc.metadata.question}\nA: ${r.doc.metadata.answer}`)
      .join("\n\n");
    const conversation = (state.history || []).slice(-4).map(t => `${t.role === "user" ? "User" : "Assistant"}: ${t.content}`).join("\n");
    const language = LANGUAGE_NAMES[state.lang] || "English";

    const generated = await generateWithLocalModel(
      `You are the WaqfApp Assistant for a Pakistani digital wallet and philanthropy app. Answer ONLY from the FAQ entries provided. ` +
      `If they do not answer the question, say so and suggest the Feedback button. Never invent features, amounts, limits or policies. ` +
      `Reply in ${language}, in a friendly, professional tone, in at most 120 words.`,
      `FAQ entries:\n${context}\n\n${conversation ? `Conversation so far:\n${conversation}\n\n` : ""}Question: ${state.question}`
    );
    if (generated) return { answer: generated, generatedBy: "local-model" as const };

    // Extractive answer: quote the best entry and point to the other relevant ones
    const t = textFor(state.lang);
    const [top, ...others] = state.relevant;
    const related = others.map(o => `- ${o.doc.metadata.question}`).join("\n");
    const answer = `${t.note}${top.doc.metadata.answer}${related ? `\n\n${t.related}\n${related}` : ""}`;
    return { answer, generatedBy: "extractive" as const };
  };

  const fallback = async (state: State) => ({ answer: textFor(state.lang).notFound, generatedBy: "none" as const });

  return new StateGraph(SupportState)
    .addNode("contextualize", contextualize)
    .addNode("retrieve", retrieve)
    .addNode("grade", grade)
    .addNode("generate", generate)
    .addNode("fallback", fallback)
    .addEdge(START, "contextualize")
    .addEdge("contextualize", "retrieve")
    .addEdge("retrieve", "grade")
    .addConditionalEdges("grade", (state: State) => (state.relevant.length ? "generate" : "fallback"), ["generate", "fallback"])
    .addEdge("generate", END)
    .addEdge("fallback", END)
    .compile();
}

export async function answerQuestion(
  graph: ReturnType<typeof buildSupportGraph>,
  input: { question: string; history: ChatTurn[]; lang: string }
) {
  const result = await graph.invoke(input);
  const sources: AnswerSource[] = result.relevant.map((r: ScoredDocument) => ({
    question: r.doc.metadata.question,
    section: r.doc.metadata.section,
  }));
  return { answer: result.answer, sources, generatedBy: result.generatedBy };
}
