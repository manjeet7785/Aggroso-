import pino from 'pino'
import { jsonSchemaFor, promptFor, schemaFor } from './prompts.js'

const logger = pino({ name: 'atlas-ai' })
const promptVersion = 'release-v1'

export function citationGuard(payload, inputIds) {
  const allowed = new Set(inputIds)
  const clean = citation => allowed.has(citation.id) ? citation : null
  const statements = payload.statements?.map(statement => ({ ...statement, citations: statement.citations.map(clean).filter(Boolean), status: statement.citations.map(clean).filter(Boolean).length ? undefined : 'unverified' }))
  const items = payload.items?.map(item => ({ ...item, citations: item.citations.map(clean).filter(Boolean) }))
  const gaps = payload.gaps?.map(gap => ({ ...gap, citations: gap.citations.map(clean).filter(Boolean) }))
  const suspects = payload.suspects?.map(suspect => ({ ...suspect, citations: suspect.citations.map(clean).filter(Boolean) }))
  return { ...payload, ...(statements ? { statements } : {}), ...(items ? { items } : {}), ...(gaps ? { gaps } : {}), ...(suspects ? { suspects } : {}) }
}

async function callNvidia(prompt, artifact) {
  const response = await fetch(`${process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1'}/chat/completions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.NVIDIA_API_KEY}` }, body: JSON.stringify({ model: process.env.NVIDIA_MODEL, messages: [{ role: 'user', content: prompt }], temperature: 0, response_format: { type: 'json_schema', json_schema: { name: artifact, strict: true, schema: jsonSchemaFor(artifact) } } }) })
  if (!response.ok) throw new Error(`NVIDIA request failed: ${response.status}`)
  const json = await response.json()
  return JSON.parse(json.choices?.[0]?.message?.content || '{}')
}

function generateFallbackStatements(version) {
  const pkg = version.package || {}
  const statements = []

  const extractText = item => typeof item === 'string' ? item : item?.text || ''

  if (pkg.features && pkg.features.length) {
    pkg.features.forEach((feat, idx) => {
      const text = extractText(feat)
      if (text) {
        statements.push({
          text: `Feature Highlight: ${text}`,
          status: 'unverified',
          citations: feat.itemId ? [{ type: 'feature', id: feat.itemId }] : []
        })
      }
    })
  }

  if (pkg.bugFixes && pkg.bugFixes.length) {
    pkg.bugFixes.forEach((fix, idx) => {
      const text = extractText(fix)
      if (text) {
        statements.push({
          text: `Bug Fix: ${text}`,
          status: 'unverified',
          citations: fix.itemId ? [{ type: 'bugfix', id: fix.itemId }] : []
        })
      }
    })
  }

  if (pkg.changedBehaviour && pkg.changedBehaviour.length) {
    pkg.changedBehaviour.forEach((cb, idx) => {
      const text = extractText(cb)
      if (text) {
        statements.push({
          text: `Behavioral Change: ${text}`,
          status: 'unverified',
          citations: cb.itemId ? [{ type: 'change', id: cb.itemId }] : []
        })
      }
    })
  }

  if (pkg.qaSummary && typeof pkg.qaSummary === 'string' && pkg.qaSummary.trim()) {
    statements.push({
      text: `QA Summary: ${pkg.qaSummary}`,
      status: 'unverified',
      citations: []
    })
  }

  if (pkg.migrationNotes && typeof pkg.migrationNotes === 'string' && pkg.migrationNotes.trim()) {
    statements.push({
      text: `Migration Note: ${pkg.migrationNotes}`,
      status: 'unverified',
      citations: []
    })
  }

  if (statements.length === 0) {
    statements.push({
      text: `Release Version ${version.versionNumber}: Core platform stability and performance improvements across services.`,
      status: 'unverified',
      citations: []
    })
  }

  return { statements }
}

export async function runArtifact(artifact, version) {
  const schema = schemaFor(artifact)
  if (!schema) throw new Error('Unsupported AI artifact')
  const prompt = promptFor(artifact, version)
  const itemIds = [...(version.package?.features || []), ...(version.package?.bugFixes || []), ...(version.package?.changedBehaviour || []), ...(version.package?.knownLimitations || [])].map(item => item.itemId).filter(Boolean)
  const qaIds = (version.evidence || []).map(row => row.evidenceId).filter(Boolean)
  const inputIds = [...itemIds, ...qaIds]

  if (process.env.NVIDIA_API_KEY) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const raw = await callNvidia(prompt, artifact)
        const parsed = schema.parse(raw)
        return { payload: citationGuard(parsed, inputIds), inputFingerprint: version.sectionHashes, promptVersion, model: process.env.NVIDIA_MODEL || 'nvidia' }
      } catch (error) {
        logger.warn({ artifact, attempt, error: error.message }, 'AI artifact NVIDIA call failed, falling back to local statement engine')
      }
    }
  }

  // Fallback statement engine if NVIDIA key not provided or call fails
  const fallbackPayload = generateFallbackStatements(version)
  return {
    payload: citationGuard(fallbackPayload, inputIds),
    inputFingerprint: version.sectionHashes,
    promptVersion,
    model: 'atlas-rules-engine'
  }
}
