import Anthropic from "@anthropic-ai/sdk";
import { PROPOSAL_SYSTEM_PROMPT, type GeneratedProposal, type ProposalProvider } from "./types";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

const TOOL: Anthropic.Tool = {
  name: "generate_proposal",
  description: "Submit the generated proposal.",
  input_schema: {
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
  } as unknown as Anthropic.Tool.InputSchema,
};

export function createAnthropicProposalProvider(apiKey: string): ProposalProvider {
  const client = new Anthropic({ apiKey });
  return {
    name: "anthropic",
    async generate(clientName: string, brief: string): Promise<GeneratedProposal> {
      const message = await client.messages.create({
        model: MODEL,
        max_tokens: 1500,
        system: PROPOSAL_SYSTEM_PROMPT,
        tools: [TOOL],
        tool_choice: { type: "tool", name: "generate_proposal" },
        messages: [{ role: "user", content: `Client: ${clientName}\n\nBrief / call notes:\n${brief}` }],
      });

      const toolUse = message.content.find((b) => b.type === "tool_use");
      if (!toolUse || toolUse.type !== "tool_use") throw new Error("Claude did not return a generate_proposal tool call.");

      const parsed = toolUse.input as {
        project_title: string;
        sections: { heading: string; body: string }[];
        line_items: { description: string; price: number }[];
      };
      return { projectTitle: parsed.project_title, sections: parsed.sections, lineItems: parsed.line_items };
    },
  };
}
