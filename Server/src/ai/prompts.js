import { z } from 'zod'

const citation = z.object({ type: z.enum(['item', 'qa']), id: z.string().min(1) })
const schemas = {
  impact_classification: z.object({ items: z.array(z.object({ itemId: z.string(), impact: z.enum(['high', 'medium', 'low']), rationale: z.string(), citations: z.array(citation) })) }),
  gap_analysis: z.object({ gaps: z.array(z.object({ section: z.string(), itemId: z.string().nullable(), reason: z.string(), citations: z.array(citation) })) }),
  claim_check: z.object({ suspects: z.array(z.object({ sid: z.string(), reason: z.string(), citations: z.array(citation) })) }),
  internal_summary: z.object({ statements: z.array(z.object({ text: z.string(), kind: z.enum(['claim', 'risk', 'limitation']), citations: z.array(citation), dependsOn: z.array(z.string()) })) }),
  stakeholder_summary: z.object({ statements: z.array(z.object({ text: z.string(), kind: z.enum(['claim', 'risk', 'limitation']), citations: z.array(citation), dependsOn: z.array(z.string()) })) }),
}

const citationSchema = { type: 'object', properties: { type: { type: 'string', enum: ['item', 'qa'] }, id: { type: 'string' } }, required: ['type', 'id'], additionalProperties: false }
const jsonSchemas = {
  impact_classification: { type: 'object', properties: { items: { type: 'array', items: { type: 'object', properties: { itemId: { type: 'string' }, impact: { type: 'string', enum: ['high', 'medium', 'low'] }, rationale: { type: 'string' }, citations: { type: 'array', items: citationSchema } }, required: ['itemId', 'impact', 'rationale', 'citations'], additionalProperties: false } } }, required: ['items'], additionalProperties: false },
  gap_analysis: { type: 'object', properties: { gaps: { type: 'array', items: { type: 'object', properties: { section: { type: 'string' }, itemId: { type: ['string', 'null'] }, reason: { type: 'string' }, citations: { type: 'array', items: citationSchema } }, required: ['section', 'itemId', 'reason', 'citations'], additionalProperties: false } } }, required: ['gaps'], additionalProperties: false },
  claim_check: { type: 'object', properties: { suspects: { type: 'array', items: { type: 'object', properties: { sid: { type: 'string' }, reason: { type: 'string' }, citations: { type: 'array', items: citationSchema } }, required: ['sid', 'reason', 'citations'], additionalProperties: false } } }, required: ['suspects'], additionalProperties: false },
  internal_summary: { type: 'object', properties: { statements: { type: 'array', items: { type: 'object', properties: { text: { type: 'string' }, kind: { type: 'string', enum: ['claim', 'risk', 'limitation'] }, citations: { type: 'array', items: citationSchema }, dependsOn: { type: 'array', items: { type: 'string' } } }, required: ['text', 'kind', 'citations', 'dependsOn'], additionalProperties: false } } }, required: ['statements'], additionalProperties: false },
  stakeholder_summary: { type: 'object', properties: { statements: { type: 'array', items: { type: 'object', properties: { text: { type: 'string' }, kind: { type: 'string', enum: ['claim', 'risk', 'limitation'] }, citations: { type: 'array', items: citationSchema }, dependsOn: { type: 'array', items: { type: 'string' } } }, required: ['text', 'kind', 'citations', 'dependsOn'], additionalProperties: false } } }, required: ['statements'], additionalProperties: false },
}

export function promptFor(artifact, version) {
  return `You are a release communication analyst. Use only the supplied release package and evidence. Return JSON matching the requested schema. Never invent IDs. Artifact: ${artifact}. Package: ${JSON.stringify(version.package)}. Evidence: ${JSON.stringify(version.evidence)}`
}
export function schemaFor(artifact) { return schemas[artifact] }
export function jsonSchemaFor(artifact) { return jsonSchemas[artifact] }
