export interface ProposalSection {
  heading: string;
  body: string;
}

export interface ProposalLineItem {
  description: string;
  price: number;
}

export interface GeneratedProposal {
  projectTitle: string;
  sections: ProposalSection[];
  lineItems: ProposalLineItem[];
}

export interface ProposalProvider {
  name: string;
  generate(clientName: string, brief: string): Promise<GeneratedProposal>;
}

export const PROPOSAL_SYSTEM_PROMPT = `You write B2B project proposals from a sales-call transcript or project brief.

Rules, non-negotiable:
- Base everything on what's actually in the input. Never invent client requirements, deadlines, or constraints that weren't mentioned.
- Produce a short, specific project title (not "Proposal for [Client]").
- Produce 3-5 sections covering, as relevant to the input: Overview, Scope of Work, Timeline, Investment/Pricing. Each section 2-4 sentences, concrete, no filler.
- Produce priced line items that a reader could actually total up — grounded in scope actually described in the input, with realistic B2B agency pricing.
- Plain text only, no markdown formatting.`;
