/** Deterministic sample workflows. No provider calls or shared visitor state. */
export function qualifyLead(x:{company:string;email:string;country:string;size:number;need:string}) {
  if(!x.company.trim()||!/^\S+@\S+\.\S+$/.test(x.email)||!x.need.trim()||!Number.isFinite(x.size)||x.size<1||x.size>1000000) throw Error('Enter a company, valid email, team size and workflow.');
  const country=x.country.trim().toLowerCase();
  const territory=/^(uae|united arab emirates|saudi arabia|qatar|kuwait|bahrain|oman)$/.test(country)?'GCC':/^(us|usa|united states)$/.test(country)?'United States':'Manual review';
  const reasons=[x.size>=10?'Team size fits the sample profile.':'Small team: check the scope before routing.',/automat|crm|support|invoice|lead|document/i.test(x.need)?'The requested workflow matches a service.':'Clarify the workflow with the prospect.',territory==='Manual review'?'Location needs human routing.':`Route to the ${territory} team.`];
  return {score:Math.min(100,30+(x.size>=10?25:10)+(/automat|crm|support|invoice|lead|document/i.test(x.need)?30:5)+(territory!=='Manual review'?15:0)),territory,reasons,followup:`Hi ${x.company.trim()} team,\n\nThanks for telling us about ${x.need.trim()}. Could you share the tools you use today and where the work gets stuck?\n\nPixel AI Solutions`};
}
export interface InvoiceReview {
  vendor: string; invoice: string; currency: string; total: string; due: string;
}
const amountPattern = /^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/;

export function validateInvoiceReview(values: InvoiceReview): string[] {
  const issues: string[] = [];
  for (const key of ['vendor', 'invoice', 'currency', 'total', 'due'] as const) {
    if (!values[key].trim()) issues.push(key);
    else if (values[key].length > 150) issues.push(`${key} (maximum 150 characters)`);
  }
  if (values.currency.trim() && !/^[A-Z]{3}$/.test(values.currency.trim().toUpperCase())) issues.push('three-letter currency');
  if (values.total.trim()) {
    const amount = values.total.trim();
    const numeric = Number(amount.replaceAll(',', ''));
    if (!amountPattern.test(amount) || !Number.isFinite(numeric) || numeric <= 0 || !Number.isSafeInteger(Math.round(numeric * 100))) issues.push('valid positive total');
  }
  if (values.due.trim()) {
    const due = values.due.trim();
    const parsed = new Date(due + 'T00:00:00Z');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(due) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== due) issues.push('valid due date (YYYY-MM-DD)');
  }
  return issues;
}

export function approveInvoiceReview(values: InvoiceReview): InvoiceReview {
  const issues = validateInvoiceReview(values);
  if (issues.length) throw Error('Correct these fields before approval: ' + issues.join(', '));
  return { vendor: values.vendor.trim(), invoice: values.invoice.trim(), currency: values.currency.trim().toUpperCase(), total: Number(values.total.replaceAll(',', '')).toFixed(2), due: values.due.trim() };
}

export function extractInvoice(text: string) {
  if (!text.trim() || text.length > 20000) throw Error('Paste invoice text between 1 and 20,000 characters.');
  const get = (r: RegExp) => text.match(r)?.[1]?.trim() ?? '';
  let values: InvoiceReview;
  if (text.trim().startsWith('{')) {
    let json: Record<string, unknown>;
    try { json = JSON.parse(text); } catch { throw Error('The JSON file is invalid. Use an object with vendor, invoice, currency, total and due fields.'); }
    const field = (...names: string[]) => { const value = names.map(name => json[name]).find(value => value !== undefined); return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : ''; };
    values = { vendor: field('vendor', 'supplier'), invoice: field('invoice', 'invoiceNumber'), currency: field('currency').toUpperCase(), total: field('total'), due: field('due', 'dueDate') };
  } else {
    values = {
      vendor: get(/^[ \t]*(?:vendor|supplier)[ \t]*:[ \t]*([^\r\n]*)$/im),
      invoice: get(/^[ \t]*invoice(?:[ \t]*(?:number|no\.?))?[ \t]*[:#][ \t]*([^\r\n]*)$/im),
      currency: get(/^[ \t]*currency[ \t]*:[ \t]*([^\r\n]*)$/im).toUpperCase(),
      total: get(/^[ \t]*(?:grand[ \t]+total|total|amount[ \t]+due)[ \t]*:[ \t]*([^\r\n]*)$/im).replace(/^(?:[A-Z]{3}[ \t]+|[$£€][ \t]*)/i, ''),
      due: get(/^[ \t]*due(?:[ \t]+date)?[ \t]*:[ \t]*([^\r\n]*)$/im),
    };
  }
  const missing = validateInvoiceReview(values);
  if (amountPattern.test(values.total)) values.total = values.total.replaceAll(',', '');
  return { ...values, missing };
}
export function analyzeTranscript(text:string) {
  const transcript=text.trim();if(!transcript||transcript.length>20000)throw Error('Enter a transcript between 1 and 20,000 characters.');
  const lines=transcript.split(/\n|(?<=[.!?])\s+/).filter(Boolean);
  const risks=lines.flatMap(evidence=>[
    /security.*block|block.*security/i.test(evidence)?{name:'Security review',evidence}:null,
    /competitor|comparing|comparison/i.test(evidence)?{name:'Alternative vendor',evidence}:null
  ].filter((x):x is {name:string;evidence:string}=>Boolean(x)));
  const evidence=lines.find(s=>/friday|monday|tuesday|wednesday|thursday|next step|send|deliver|proposal|follow.up/i.test(s))??lines[0];
  const conditional=/maybe|possibly|might|depending|\bif\b|tentative/i.test(evidence);
  const date=conditional?'Unconfirmed':(evidence.match(/\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|\d{4}-\d{2}-\d{2})\b/i)?.[0]??'Unconfirmed');
  return {transcript,summary:lines.slice(0,2).join(' '),evidence,date,owner:'Unconfirmed',conditional,risks,followup:`Thanks for the conversation.\n\nProposed next step for review:\n${evidence}\n\nPlease confirm the owner and timing before we assign it.\n\nPixel AI Solutions`};
}
export function classifyReply(text:string) {
  if(!text.trim())return 'empty';
  if(/unsubscribe|remove me|stop contacting|opt.?out|no thanks|do not contact/i.test(text))return 'unsubscribe';
  if(/no budget|not interested|too expensive|not now|already use/i.test(text))return 'objection';
  if(/interested|book|demo|meeting|tell me more/i.test(text))return 'interested';return 'review';
}
export function supportReply(message:string,email:string):{answer:string;handoff:boolean} {
  if(!message.trim()||message.length>2000)throw Error('Enter a question between 1 and 2,000 characters.');
  if(/human|person|complaint|agent please/i.test(message))return {answer:'Sample handoff prepared. Your question and the chat history are attached below for the support team. No real ticket has been sent.',handoff:true};
  if(/order|tracking|1042/i.test(message)) {
    if(!email.trim())return {answer:'For the sample order, enter the matching customer email: jamie.rivera@example.com. Then ask about order 1042.',handoff:false};
    if(email.toLowerCase().trim()!=='jamie.rivera@example.com')return {answer:'I cannot verify those details. Check the sample email or ask for a human. No order information has been released.',handoff:false};
    if(!/1042/.test(message))return {answer:'Use fictional order 1042 to explore this sample lookup.',handoff:false};
    return {answer:'Sample order 1042 is in transit with Trail Express. Estimated delivery: 2 business days. Source: fictional order record 1042.',handoff:false};
  }
  if(/return|refund|exchange/i.test(message))return {answer:'Unused items with their original tags can be returned within 30 days. Worn footwear is excluded. Source: sample Returns Policy, section 1. For an exception, ask for a human.',handoff:false};
  if(/shipping|delivery|ship/i.test(message))return {answer:'Sample standard shipping takes 3–5 business days. Source: sample Shipping Policy, section 1.',handoff:false};
  return {answer:'That answer is not in the sample knowledge base. Ask about returns, shipping, or order 1042, or request a human handoff.',handoff:false};
}
export function reminderDraft(invoice:{id:string;customer:string;amount:number;disputed:boolean},tone:string) {
  if(invoice.disputed)throw Error('This invoice is disputed. Resolve the dispute before drafting another reminder.');
  if(!Number.isFinite(invoice.amount)||invoice.amount<=0)throw Error('No outstanding balance remains.');
  return `Subject: ${tone==='firm'?'Payment follow-up':'A quick check-in'} — ${invoice.id}\n\nHi ${invoice.customer},\n\n${tone==='firm'?'Please confirm the payment date for':'A friendly reminder about'} invoice ${invoice.id}, with an outstanding sample balance of USD ${invoice.amount.toFixed(2)}. If anything needs clarification, please reply so the team can help.\n\nPixel AI Solutions`;
}
