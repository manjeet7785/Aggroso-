export function supportsClaim(statement, evidenceById) {
  const qa = (statement.citations || []).filter(citation => citation.type === 'qa')
  if (!qa.length) return 'unsupported: no QA evidence cited'
  if (qa.every(citation => evidenceById.get(citation.id)?.status !== 'passed')) return 'unsupported: evidence not passing'
  if (statement.dependsOn?.length && qa.some(citation => { const row = evidenceById.get(citation.id); return row?.itemRefs?.length && !statement.dependsOn.some(id => row.itemRefs.includes(id)) })) return 'weak linkage'
  return null
}
