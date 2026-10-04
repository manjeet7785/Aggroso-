import { versionDiff } from './versionDiff.js'

export function onVersionBump(oldVersion, newVersion, statements = []) {
  const diff = versionDiff(oldVersion, newVersion), changedIds = new Set()
  Object.values(diff).forEach(section => [...section.added, ...section.removed, ...section.modified].forEach(id => changedIds.add(id)))
  return statements.filter(statement => statement.dependsOn?.some(id => changedIds.has(id))).map(statement => ({ sid: statement.sid, status: 'stale', staleReason: `${statement.dependsOn.find(id => changedIds.has(id))} changed` }))
}
