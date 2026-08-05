import { PROPOSAL_SYSTEM_PROMPT, type GeneratedProposal, type ProposalProvider } from "./types";

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const RETRY_DELAYS_MS = [2000, 8000, 20000];

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    project_title: { type: "STRING" },
    sections: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: { heading: { type: "STRING" }, body: { type: "STRING" } },
        required: ["heading", "body"],
      },
    },
    line_items: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: { description: { type: "STRING" }, price: { type: "NUMBER" } },
        required: ["description", "price"],
      },
    },
  },
  required: ["project_title", "sections", "line_items"],
};

interface GenerateContentResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

export function createGeminiProposalProvider(apiKey: string): ProposalProvider {
  return {
    name: "gemini",
    async generate(clientName: string, brief: string): Promise<GeneratedProposal> {
      const body = JSON.stringify({
        systemInstruction: { parts: [{ text: PROPOSAL_SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: `Client: ${clientName}\n\nBrief / call notes:\n${brief}` }] }],
        generationConfig: { responseMimeType: "application/json", responseSchema: RESPONSE_SCHEMA },
      });

      let lastError: Error = new Error("unreachable");
      for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
        const res = await fetch(`${BASE_URL}/models/${MODEL}:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });
        if (res.ok) {
          const data = (await res.json()) as GenerateContentResponse;
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!text) throw new Error("Gemini returned no content.");
          const parsed = JSON.parse(text) as {
            project_title: string;
            sections: { heading: string; body: string }[];
            line_items: { description: string; price: number }[];
          };
          return { projectTitle: parsed.project_title, sections: parsed.sections, lineItems: parsed.line_items };
        }
        lastError = new Error(`Gemini generateContent failed: ${res.status} ${await res.text()}`);
        if (!RETRYABLE_STATUS.has(res.status) || attempt === RETRY_DELAYS_MS.length) throw lastError;
        await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]));
      }
      throw lastError;
    },
  };
}
