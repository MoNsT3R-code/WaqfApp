/**
 * Help Center assistant: a LangGraph RAG pipeline over the FAQ knowledge base.
 *
 *   START -> guard --blocked--> refuse -> END
 *                  \--safe---> contextualize -> retrieve -> grade --relevant--> generate -> END
 *                                                                \--none-----> fallback -> END
 *
 * The guard (after BreachMirror AI's) blocks prompt-injection attempts and redacts
 * PINs, one-time codes, card numbers, CNICs and passwords before anything is searched.
 */
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { ARABIC_SCRIPT, CROSS_LINGUAL_THRESHOLD, FaqKnowledgeBase, MIN_KEYWORD_COVERAGE, RELEVANCE_THRESHOLD, type ScoredDocument } from "./knowledge.ts";
import { LANGUAGE_NAMES, generateWithLocalModel } from "./llm.ts";
import { guardInput } from "../security/guard.ts";

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
  generatedBy: Annotation<"local-model" | "extractive" | "none" | "blocked">,
  notice: Annotation<string>,
  blocked: Annotation<boolean>,
});
type State = typeof SupportState.State;

const TEXT = {
  en: {
    notFound: "I couldn't find that in the WaqfApp FAQ. Try asking with the name of the feature, for example \"How do I pay a bill?\" or \"What is the Quick Loan limit?\". If the FAQ doesn't cover it, please tell the team through the Feedback button.",
    related: "Related questions:",
    note: "",
    refused: "I can only answer questions about WaqfApp and its policies, and I can't change how I work. Try asking about a feature, for example \"How do I pay a bill?\".",
    redacted: "Your message contained what looks like a {found}. I removed it before searching. Never share your PIN, one-time codes, card numbers or passwords with anyone, including WaqfApp. If it was real, change it now.",
  },
  ur: {
    notFound: "مجھے یہ سوال WaqfApp کے FAQ میں نہیں ملا۔ براہ کرم فیچر کا نام لے کر دوبارہ پوچھیں، مثلاً \"بل کیسے ادا کروں؟\"۔ اگر FAQ میں اس کا جواب نہیں ہے تو Feedback بٹن کے ذریعے ٹیم کو بتائیں۔",
    related: "متعلقہ سوالات:",
    note: "(یہ جواب انگریزی FAQ سے لیا گیا ہے)\n\n",
    refused: "میں صرف WaqfApp اور اس کی پالیسیوں کے بارے میں سوالات کے جواب دے سکتا ہوں، اور اپنے کام کا طریقہ تبدیل نہیں کر سکتا۔",
    redacted: "آپ کے پیغام میں {found} جیسی معلومات تھیں۔ میں نے تلاش سے پہلے انہیں ہٹا دیا۔ اپنا PIN، ون ٹائم کوڈ، کارڈ نمبر یا پاس ورڈ کبھی کسی کو نہ بتائیں، WaqfApp کو بھی نہیں۔ اگر یہ اصلی تھا تو ابھی تبدیل کریں۔",
  },
  ar: {
    notFound: "لم أجد هذا السؤال في الأسئلة الشائعة لتطبيق WaqfApp. حاول السؤال باسم الميزة، مثل \"كيف أدفع فاتورة؟\". إذا لم تغطه الأسئلة الشائعة، فأخبر الفريق عبر زر الملاحظات.",
    related: "أسئلة ذات صلة:",
    note: "(هذه الإجابة مأخوذة من الأسئلة الشائعة باللغة الإنجليزية)\n\n",
    refused: "يمكنني فقط الإجابة عن أسئلة حول WaqfApp وسياساته، ولا يمكنني تغيير طريقة عملي.",
    redacted: "احتوت رسالتك على ما يبدو أنه {found}. أزلته قبل البحث. لا تشارك أبدًا رمز PIN أو الرموز لمرة واحدة أو أرقام البطاقات أو كلمات المرور مع أي أحد، بما في ذلك WaqfApp. إذا كان حقيقيًا فغيّره الآن.",
  },
} as const;

const textFor = (lang: string) => TEXT[lang as keyof typeof TEXT] || TEXT.en;

const FOLLOW_UP = /^(and|also|what about|how about|then|so|but|it|that|this|اور|کیا|و|ماذا عن)\b/i;

export function buildSupportGraph(kb: FaqKnowledgeBase) {
  // Blocks instruction-override attempts; redacts secrets in the question and the earlier turns
  const guard = async (state: State) => {
    const checked = guardInput(state.question);
    if (checked.route === "blocked") return { blocked: true, notice: "" };
    const history = (state.history || []).map(t => (t.role === "user" ? { ...t, content: guardInput(t.content).text } : t));
    const notice = checked.found.length ? textFor(state.lang).redacted.replace("{found}", checked.found.join(", ")) : "";
    return { blocked: false, question: checked.text, history, notice };
  };

  const refuse = async (state: State) => ({ answer: textFor(state.lang).refused, generatedBy: "blocked" as const, relevant: [] });

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
    .addNode("guard", guard)
    .addNode("refuse", refuse)
    .addNode("contextualize", contextualize)
    .addNode("retrieve", retrieve)
    .addNode("grade", grade)
    .addNode("generate", generate)
    .addNode("fallback", fallback)
    .addEdge(START, "guard")
    .addConditionalEdges("guard", (state: State) => (state.blocked ? "refuse" : "contextualize"), ["refuse", "contextualize"])
    .addEdge("refuse", END)
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
  const result = await graph.invoke({ ...input, notice: "", blocked: false });
  const sources: AnswerSource[] = (result.relevant || []).map((r: ScoredDocument) => ({
    question: r.doc.metadata.question,
    section: r.doc.metadata.section,
  }));
  const answer = result.notice ? `${result.notice}\n\n${result.answer}` : result.answer;
  return { answer, sources, generatedBy: result.generatedBy, redacted: Boolean(result.notice) };
}
