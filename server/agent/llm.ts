/**
 * Optional local chat model. With OLLAMA_MODEL set (e.g. "llama3.2:3b") the agents use
 * Ollama running on this machine to write answers; otherwise they answer extractively.
 * Either way no API key or external AI service is involved.
 */
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatOllama } from "@langchain/ollama";

export const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "";
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

let model: BaseChatModel | null = null;

export function getChatModel(): BaseChatModel | null {
  if (!OLLAMA_MODEL) return null;
  if (!model) model = new ChatOllama({ model: OLLAMA_MODEL, baseUrl: OLLAMA_BASE_URL, temperature: 0.2 });
  return model;
}

export const LANGUAGE_NAMES: Record<string, string> = { en: "English", ur: "Urdu", ar: "Arabic" };

/** Returns the model's text reply, or null when no model is configured or the call fails. */
export async function generateWithLocalModel(system: string, prompt: string): Promise<string | null> {
  const chat = getChatModel();
  if (!chat) return null;
  try {
    const reply = await chat.invoke([
      { role: "system", content: system },
      { role: "user", content: prompt },
    ]);
    const text = typeof reply.content === "string" ? reply.content : reply.text;
    return text?.trim() || null;
  } catch (e: any) {
    console.warn(`[Agent] Local model "${OLLAMA_MODEL}" failed, answering extractively: ${e?.message || e}`);
    return null;
  }
}
