import type { ProposalProvider } from "./types";
import { createAnthropicProposalProvider } from "./anthropic";
import { createGeminiProposalProvider } from "./gemini";
import { createOpenRouterProposalProvider } from "./openrouter";

export function getProposalProvider(): ProposalProvider {
  const requested = process.env.AI_PROVIDER?.toLowerCase();

  if (requested === "anthropic") return requireAnthropic();
  if (requested === "gemini") return requireGemini();
  if (requested === "openrouter") return requireOpenRouter();

  if (process.env.ANTHROPIC_API_KEY) return requireAnthropic();
  if (process.env.GEMINI_API_KEY) return requireGemini();
  if (process.env.OPENROUTER_API_KEY) return requireOpenRouter();

  throw new Error("No AI provider configured — set ANTHROPIC_API_KEY, GEMINI_API_KEY, or OPENROUTER_API_KEY.");
}

function requireAnthropic(): ProposalProvider {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set.");
  return createAnthropicProposalProvider(process.env.ANTHROPIC_API_KEY);
}
function requireGemini(): ProposalProvider {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set.");
  return createGeminiProposalProvider(process.env.GEMINI_API_KEY);
}
function requireOpenRouter(): ProposalProvider {
  if (!process.env.OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not set.");
  return createOpenRouterProposalProvider(process.env.OPENROUTER_API_KEY);
}

export type { ProposalProvider, GeneratedProposal, ProposalSection, ProposalLineItem } from "./types";
