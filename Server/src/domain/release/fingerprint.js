import crypto from 'node:crypto'

export const fpSection = value => crypto.createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex').slice(0, 12)

export function sectionHashes(pkg = {}) {
  return Object.fromEntries(['features', 'bugFixes', 'changedBehaviour', 'knownLimitations', 'qaSummary', 'migrationNotes', 'affectedUserGroups'].map(key => [key, fpSection(pkg[key])]))
}
