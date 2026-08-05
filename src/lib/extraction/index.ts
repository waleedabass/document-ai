import type { DocumentExtractionProvider } from "./types";
import { createAnthropicExtractionProvider } from "./anthropic";
import { createGeminiExtractionProvider } from "./gemini";

// Vision-capable providers only — Claude or Gemini. OpenRouter's free
// models aren't reliable enough for document vision to include here (see
// README); it's used for the text-only proposal-generation lane instead.
export function getExtractionProvider(): DocumentExtractionProvider {
  const requested = process.env.AI_PROVIDER?.toLowerCase();

  if (requested === "anthropic") return requireAnthropic();
  if (requested === "gemini") return requireGemini();

  if (process.env.ANTHROPIC_API_KEY) return requireAnthropic();
  if (process.env.GEMINI_API_KEY) return requireGemini();

  throw new Error("No vision-capable AI provider configured — set ANTHROPIC_API_KEY or GEMINI_API_KEY.");
}

function requireAnthropic(): DocumentExtractionProvider {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set.");
  return createAnthropicExtractionProvider(process.env.ANTHROPIC_API_KEY);
}

function requireGemini(): DocumentExtractionProvider {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set.");
  return createGeminiExtractionProvider(process.env.GEMINI_API_KEY);
}

export type { DocumentExtractionProvider, ExtractionResult, ExtractedFieldData, ExtractedLineItemData } from "./types";
