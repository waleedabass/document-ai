import { PROPOSAL_SYSTEM_PROMPT, type GeneratedProposal, type ProposalProvider } from "./types";

const BASE_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-oss-20b:free";
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const RETRY_DELAYS_MS = [2000, 8000, 20000];

const TOOL = {
  type: "function" as const,
  function: {
    name: "generate_proposal",
    description: "Submit the generated proposal.",
    parameters: {
      type: "object",
      properties: {
        project_title: { type: "string" },
        sections: {
          type: "array",
          items: {
            type: "object",
            properties: { heading: { type: "string" }, body: { type: "string" } },
            required: ["heading", "body"],
          },
        },
        line_items: {
          type: "array",
          items: {
            type: "object",
            properties: { description: { type: "string" }, price: { type: "number" } },
            required: ["description", "price"],
          },
        },
      },
      required: ["project_title", "sections", "line_items"],
    },
  },
};

interface ChatCompletionResponse {
  choices?: { message?: { tool_calls?: { function: { arguments: string } }[] } }[];
}

export function createOpenRouterProposalProvider(apiKey: string): ProposalProvider {
  return {
    name: "openrouter",
    async generate(clientName: string, brief: string): Promise<GeneratedProposal> {
      const body = JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: PROPOSAL_SYSTEM_PROMPT },
          { role: "user", content: `Client: ${clientName}\n\nBrief / call notes:\n${brief}` },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "generate_proposal" } },
      });

      let lastError: Error = new Error("unreachable");
      for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
        const res = await fetch(BASE_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://arcautomations.in",
            "X-Title": "ARC Automations Document AI",
          },
          body,
        });
        if (res.ok) {
          const data = (await res.json()) as ChatCompletionResponse;
          const call = data.choices?.[0]?.message?.tool_calls?.[0];
          if (!call) throw new Error("OpenRouter did not return a generate_proposal tool call.");
          const parsed = JSON.parse(call.function.arguments) as {
            project_title: string;
            sections: { heading: string; body: string }[];
            line_items: { description: string; price: number }[];
          };
          return { projectTitle: parsed.project_title, sections: parsed.sections, lineItems: parsed.line_items };
        }
        lastError = new Error(`OpenRouter chat completion failed: ${res.status} ${await res.text()}`);
        if (!RETRYABLE_STATUS.has(res.status) || attempt === RETRY_DELAYS_MS.length) throw lastError;
        await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]));
      }
      throw lastError;
    },
  };
}
