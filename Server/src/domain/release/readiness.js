export function checkReadiness(version) {
  const pkg = version.package || {}, issues = [], required = [['features', pkg.features], ['bugFixes', pkg.bugFixes], ['changedBehaviour', pkg.changedBehaviour], ['knownLimitations', pkg.knownLimitations], ['qaSummary', pkg.qaSummary], ['migrationNotes', pkg.migrationNotes], ['affectedUserGroups', pkg.affectedUserGroups]]
  for (const [id, value] of required) if (!value || (Array.isArray(value) && value.length === 0)) issues.push({ id: `required-${id}`, severity: 'critical', message: `${id} is required`, refs: [] })
  if ((pkg.changedBehaviour || []).length && !pkg.migrationNotes?.trim()) issues.push({ id: 'migration-required', severity: 'critical', message: 'Migration notes are required when behaviour changes', refs: ['changedBehaviour'] })
  const allItems = [...(pkg.features || []), ...(pkg.bugFixes || [])], evidence = new Map((version.evidence || []).map(row => [row.evidenceId, row]))
  for (const item of allItems) {
    if (!item.evidenceRefs?.length) issues.push({ id: `evidence-${item.itemId}`, severity: 'critical', message: `${item.itemId} needs evidence`, refs: [item.itemId] })
    for (const id of item.evidenceRefs || []) if (!evidence.has(id)) issues.push({ id: `missing-${id}`, severity: 'critical', message: `Evidence ${id} does not resolve`, refs: [item.itemId, id] })
    if (item.severity === 'critical' && !(item.evidenceRefs || []).some(id => evidence.get(id)?.status === 'passed')) issues.push({ id: `critical-${item.itemId}`, severity: 'critical', message: 'Critical bug needs passing evidence', refs: [item.itemId] })
  }
  if ((version.evidence || []).length && !pkg.qaSummary?.trim()) issues.push({ id: 'qa-summary', severity: 'critical', message: 'QA summary is required when evidence exists', refs: [] })
  return issues
}
