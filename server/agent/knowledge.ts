/**
 * FAQ knowledge base for the RAG agents.
 *
 * Every "## question" in docs/faq/*.md becomes one LangChain Document. Documents are
 * embedded locally with a Hugging Face model (Transformers.js, no API key) and kept in
 * an in-memory vector store. If the embedding model cannot load (e.g. offline on first
 * start), retrieval falls back to BM25 keyword search over the same documents.
 */
import fs from "fs/promises";
import os from "os";
import path from "path";
import { Document } from "@langchain/core/documents";
import { Embeddings } from "@langchain/core/embeddings";
import { VectorStore } from "@langchain/core/vectorstores";

export const EMBEDDINGS_MODEL = process.env.EMBEDDINGS_MODEL || "Xenova/paraphrase-multilingual-MiniLM-L12-v2";
// Kept outside node_modules: ONNX Runtime cannot open model files on Windows paths over 260 characters
export const MODELS_CACHE_DIR = process.env.MODELS_CACHE_DIR || path.join(os.homedir(), ".cache", "waqfapp", "models");

export type FaqMetadata = { section: string; question: string; answer: string; source: string };
export type FaqDocument = Document<FaqMetadata>;
export type ScoredDocument = { doc: FaqDocument; score: number; coverage?: number };
export type RetrievalMode = "embeddings" | "keyword";

/** Parses the Markdown FAQ files: "# " starts a section, "## " a question, the rest is its answer. */
export async function loadFaqDocuments(faqDir: string): Promise<FaqDocument[]> {
  const files = (await fs.readdir(faqDir)).filter(f => f.endsWith(".md")).sort();
  const docs: FaqDocument[] = [];

  for (const file of files) {
    const text = await fs.readFile(path.join(faqDir, file), "utf-8");
    let section = "";
    let current: { question: string; lines: string[] } | null = null;

    const flush = () => {
      if (!current) return;
      const answer = current.lines.join(" ").replace(/\s+/g, " ").trim();
      docs.push(new Document<FaqMetadata>({
        pageContent: `${current.question}\n${answer}`,
        metadata: { section, question: current.question, answer, source: file },
      }));
      current = null;
    };

    for (const line of text.split(/\r?\n/)) {
      if (line.startsWith("## ")) {
        flush();
        current = { question: line.slice(3).trim(), lines: [] };
      } else if (line.startsWith("# ")) {
        flush();
        section = line.slice(2).trim();
      } else if (current && line.trim()) {
        current.lines.push(line.trim());
      }
    }
    flush();
  }
  return docs;
}

/** LangChain Embeddings backed by a local Transformers.js feature-extraction pipeline. */
export class LocalTransformersEmbeddings extends Embeddings {
  private extractor: Promise<any> | null = null;

  constructor(private model = EMBEDDINGS_MODEL) {
    super({});
  }

  private getExtractor() {
    if (!this.extractor) {
      this.extractor = import("@huggingface/transformers").then(({ pipeline, env }) => {
        env.cacheDir = MODELS_CACHE_DIR;
        return pipeline("feature-extraction", this.model, { dtype: "q8" });
      });
    }
    return this.extractor;
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    const extractor = await this.getExtractor();
    const vectors: number[][] = [];
    for (let i = 0; i < texts.length; i += 16) {
      const output = await extractor(texts.slice(i, i + 16), { pooling: "mean", normalize: true });
      vectors.push(...(output.tolist() as number[][]));
    }
    return vectors;
  }

  async embedQuery(text: string): Promise<number[]> {
    const [vector] = await this.embedDocuments([text]);
    return vector;
  }
}

/** Minimal in-memory LangChain VectorStore using cosine similarity (vectors are normalised). */
export class InMemoryFaqVectorStore extends VectorStore {
  declare FilterType: (doc: Document) => boolean;
  private entries: { vector: number[]; doc: Document }[] = [];

  _vectorstoreType() {
    return "in-memory-faq";
  }

  async addDocuments(documents: Document[]) {
    const vectors = await this.embeddings.embedDocuments(documents.map(d => d.pageContent));
    return this.addVectors(vectors, documents);
  }

  async addVectors(vectors: number[][], documents: Document[]) {
    vectors.forEach((vector, i) => this.entries.push({ vector, doc: documents[i] }));
  }

  async similaritySearchVectorWithScore(query: number[], k: number, filter?: this["FilterType"]): Promise<[Document, number][]> {
    return this.entries
      .filter(e => !filter || filter(e.doc))
      .map(e => [e.doc, e.vector.reduce((sum, v, i) => sum + v * query[i], 0)] as [Document, number])
      .sort((a, b) => b[1] - a[1])
      .slice(0, k);
  }
}

const STOPWORDS = new Set([
  ..."a an and are as at be by can do does for from how i if in is it my of on or the to what when where which who why will with you your me we our".split(" "),
  // Urdu
  ..."کیا ہے ہیں میں کا کی کے کو سے اور کیسے یہ وہ پر بھی تو".split(" "),
  // Arabic
  ..."ما هو هي في من على عن كيف ماذا هل أن إلى مع لا".split(" "),
]);

const tokenize = (text: string) =>
  (text.toLowerCase().match(/[\p{L}\p{N}]+/gu) || []).filter(t => t.length > 1 && !STOPWORDS.has(t));

/** BM25 keyword index: the keyword half of hybrid retrieval, and the fallback without embeddings. */
class Bm25Index {
  private docTokens: string[][];
  private docFreq = new Map<string, number>();
  private avgLength: number;

  constructor(private docs: FaqDocument[], private k1 = 1.4, private b = 0.75) {
    // Questions are weighted triple: they are short and say what the entry is about
    this.docTokens = docs.map(d => {
      const q = tokenize(d.metadata.question);
      return [...q, ...q, ...q, ...tokenize(d.metadata.answer)];
    });
    for (const tokens of this.docTokens) {
      for (const t of new Set(tokens)) this.docFreq.set(t, (this.docFreq.get(t) || 0) + 1);
    }
    this.avgLength = this.docTokens.reduce((s, t) => s + t.length, 0) / Math.max(docs.length, 1);
  }

  /** BM25 score and the fraction of query terms found, for every document. */
  scores(query: string) {
    const terms = [...new Set(tokenize(query))];
    const n = this.docs.length;
    return this.docTokens.map(tokens => {
      let score = 0;
      let matched = 0;
      for (const term of terms) {
        const tf = tokens.filter(t => t === term).length;
        if (!tf) continue;
        matched++;
        const df = this.docFreq.get(term) || 0;
        const idf = Math.log(1 + (n - df + 0.5) / (df + 0.5));
        score += idf * (tf * (this.k1 + 1)) / (tf + this.k1 * (1 - this.b + this.b * tokens.length / this.avgLength));
      }
      return { score, coverage: terms.length ? matched / terms.length : 0 };
    });
  }

  /** `context` (the previous question) contributes at a lower weight, for follow-up questions. */
  search(query: string, k: number, context?: string): ScoredDocument[] {
    const main = this.scores(query);
    const extra = context ? this.scores(context) : null;
    return main
      .map((m, i) => ({ doc: this.docs[i], score: m.score + 0.4 * (extra?.[i].score || 0), coverage: m.coverage }))
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }
}

/** Relevance thresholds used by the agents' grade step, per retrieval mode. */
export const RELEVANCE_THRESHOLD: Record<RetrievalMode, number> = { embeddings: 0.5, keyword: 4 };
/** Urdu/Arabic questions matched against the English FAQ score lower; off-topic ones stay below ~0.3. */
export const CROSS_LINGUAL_THRESHOLD = 0.42;
export const ARABIC_SCRIPT = /[\u0600-\u06FF]/;
/** In keyword mode, at least this share of the question's terms must appear in an entry. */
export const MIN_KEYWORD_COVERAGE = 0.5;
/** Weight of the normalised BM25 bonus added to cosine similarity in hybrid ranking. */
const HYBRID_KEYWORD_WEIGHT = 0.25;

export class FaqKnowledgeBase {
  mode: RetrievalMode = "keyword";
  documents: FaqDocument[] = [];
  error: string | null = null;
  private vectorStore: InMemoryFaqVectorStore | null = null;
  private bm25: Bm25Index | null = null;
  private ready: Promise<void>;
  private isReady = false;

  /** One or more folders of Markdown: the FAQ, and the imported security policies */
  constructor(private dirs: string | string[]) {
    this.ready = this.build();
  }

  private async build() {
    const started = Date.now();
    const folders = Array.isArray(this.dirs) ? this.dirs : [this.dirs];
    this.documents = (await Promise.all(folders.map(dir => loadFaqDocuments(dir).catch(() => [])))).flat();
    this.bm25 = new Bm25Index(this.documents);
    try {
      const store = new InMemoryFaqVectorStore(new LocalTransformersEmbeddings(), {});
      await store.addDocuments(this.documents);
      this.vectorStore = store;
      this.mode = "embeddings";
    } catch (e: any) {
      this.error = e?.message || String(e);
      console.warn(`[Agent] Embedding model unavailable, using keyword search: ${this.error}`);
    }
    this.isReady = true;
    console.log(`[Agent] Indexed ${this.documents.length} FAQ entries (${this.mode}) in ${((Date.now() - started) / 1000).toFixed(1)}s`);
  }

  whenReady() {
    return this.ready;
  }

  /**
   * Returns the k closest entries. For a follow-up question, pass the previous question as
   * `context`: its embedding is blended in at 30% so the topic carries over.
   */
  async search(query: string, k = 5, context?: string): Promise<ScoredDocument[]> {
    await this.ready;
    if (!this.vectorStore) return this.bm25!.search(query, k, context);

    const embeddings = this.vectorStore.embeddings;
    let vector = await embeddings.embedQuery(query);
    if (context) {
      const contextVector = await embeddings.embedQuery(context);
      const blended = vector.map((v, i) => 0.7 * v + 0.3 * contextVector[i]);
      const norm = Math.hypot(...blended);
      vector = blended.map(v => v / norm);
    }
    // Hybrid ranking: cosine similarity plus a BM25 bonus, so rare names the embedding model
    // does not know (Kolachi, Ollama, SNGPL) still count. The bonus is scaled by the square of
    // the share of query terms matched, so one incidental word match adds almost nothing.
    const keywordQuery = this.bm25!.scores(query);
    const keywordContext = context ? this.bm25!.scores(context) : null;
    const keyword = keywordQuery.map((s, i) => ({ score: s.score + 0.4 * (keywordContext?.[i].score || 0), coverage: s.coverage }));
    const maxKeyword = Math.max(...keyword.map(s => s.score), 1e-9);
    const results = await this.vectorStore.similaritySearchVectorWithScore(vector, this.documents.length);
    return results
      .map(([doc, cosine]) => {
        const kw = keyword[this.documents.indexOf(doc as FaqDocument)];
        return { doc: doc as FaqDocument, score: cosine + HYBRID_KEYWORD_WEIGHT * (kw.score / maxKeyword) * kw.coverage ** 2 };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }

  status() {
    return {
      ready: this.isReady,
      entries: this.documents.length,
      retrieval: this.mode,
      embeddingsModel: this.mode === "embeddings" ? EMBEDDINGS_MODEL : null,
      error: this.error,
    };
  }
}
