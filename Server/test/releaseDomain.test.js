import { describe, expect, it } from 'vitest'
import { checkReadiness } from '../src/domain/release/readiness.js'
import { supportsClaim } from '../src/domain/release/claimChecker.js'
import { versionDiff } from '../src/domain/release/versionDiff.js'
import { fpSection } from '../src/domain/release/fingerprint.js'

const base = { package: { features: [{ itemId: 'feat-1', text: 'SSO', evidenceRefs: ['qa-1'] }], bugFixes: [], changedBehaviour: [], knownLimitations: [{ itemId: 'lim-1', text: 'Claims unavailable', evidenceRefs: [] }], qaSummary: 'Passed', migrationNotes: 'None', affectedUserGroups: ['admins'] }, evidence: [{ evidenceId: 'qa-1', status: 'passed', itemRefs: ['feat-1'] }] }

describe('release domain', () => {
  it('reports missing required sections and unresolved evidence', () => {
    const issues = checkReadiness({ package: { ...base.package, migrationNotes: '' }, evidence: base.evidence })
    expect(issues.some(issue => issue.id === 'required-migrationNotes')).toBe(true)
  })
  it('checks QA citations and linkage', () => {
    expect(supportsClaim({ citations: [], dependsOn: [] }, new Map())).toBe('unsupported: no QA evidence cited')
    const evidence = new Map([['qa-1', { status: 'passed', itemRefs: ['feat-1'] }]])
    expect(supportsClaim({ citations: [{ type: 'qa', id: 'qa-1' }], dependsOn: ['feat-1'] }, evidence)).toBeNull()
  })
  it('diffs stable item IDs and fingerprints sections', () => {
    expect(versionDiff({ package: { features: [{ itemId: 'feat-1', text: 'old' }] } }, { package: { features: [{ itemId: 'feat-1', text: 'new' }, { itemId: 'feat-2', text: 'new' }] } }).features).toEqual({ added: ['feat-2'], removed: [], modified: ['feat-1'] })
    expect(fpSection({ a: 1 })).toHaveLength(12)
  })
})
