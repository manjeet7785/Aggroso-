import express from 'express'
import mongoose from 'mongoose'
import { Release, ReleaseVersion } from '../models/Release.js'
import { Statement } from '../models/Statement.js'
import { AuditLog } from '../models/AuditLog.js'
import { sectionHashes } from '../domain/release/fingerprint.js'
import { checkReadiness } from '../domain/release/readiness.js'
import { versionDiff } from '../domain/release/versionDiff.js'
import { onVersionBump } from '../domain/release/staleness.js'
import { runArtifact } from '../ai/agentLoop.js'
import { aiWriteBlock } from '../middleware/aiWriteBlock.js'
import { requireHumanSession } from '../middleware/humanSession.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()
const id = value => mongoose.Types.ObjectId.isValid(value)
const current = async (releaseId, versionNumber) => ReleaseVersion.findOne({ releaseId, versionNumber })
const safe = handler => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)
const itemIds = version => [...(version.package?.features || []), ...(version.package?.bugFixes || []), ...(version.package?.changedBehaviour || []), ...(version.package?.knownLimitations || [])].map(item => item.itemId)

router.use(authenticate)
router.get('/', authenticate, safe(async (req, res) => res.json(await Release.find({ ownerId: req.user._id }).sort({ createdAt: -1 }))))
router.post('/', authenticate, safe(async (req, res) => res.status(201).json(await Release.create({ title: req.body.title, ownerId: req.user._id }))))
router.post('/:id/versions', safe(async (req, res) => {
  if (!id(req.params.id)) return res.status(400).json({ error: 'invalid release id' })
  const parent = await ReleaseVersion.findOne({ releaseId: req.params.id }).sort({ versionNumber: -1 })
  const version = await ReleaseVersion.create({ releaseId: req.params.id, versionNumber: (parent?.versionNumber || 0) + 1, parentVersionId: parent?._id || null, package: req.body.package || {}, evidence: req.body.evidence || [], sectionHashes: sectionHashes(req.body.package || {}) })
  res.status(201).json(version)
}))
router.get('/:id/versions', authenticate, safe(async (req, res) => res.json(await ReleaseVersion.find({ releaseId: req.params.id }).sort({ versionNumber: -1 }))))
router.get('/:id/versions/:v', authenticate, safe(async (req, res) => { const version = await current(req.params.id, Number(req.params.v)); if (!version) return res.status(404).json({ error: 'version not found' }); res.json(version) }))
router.patch('/:id/versions/:v', aiWriteBlock, safe(async (req, res) => {
  const version = await current(req.params.id, Number(req.params.v))
  if (!version) return res.status(404).json({ error: 'version not found' })
  if (version.status === 'final') return res.status(409).json({ error: 'final versions are immutable' })
  const old = version.toObject()
  Object.assign(version, { package: req.body.package || version.package, evidence: req.body.evidence || version.evidence })
  version.sectionHashes = sectionHashes(version.package)
  await version.save()
  const affected = await Statement.find({ releaseVersionId: version._id })
  const stale = onVersionBump(old, version, affected)
  for (const change of stale) await Statement.updateOne({ sid: change.sid }, change)
  res.json(version)
}))
router.get('/:id/versions/:v/readiness', safe(async (req, res) => { const version = await current(req.params.id, Number(req.params.v)); if (!version) return res.status(404).json({ error: 'version not found' }); res.json({ issues: checkReadiness(version) }) }))
router.post('/:id/versions/:v/generate/:artifact', aiWriteBlock, safe(async (req, res) => {
  const version = await current(req.params.id, Number(req.params.v)); if (!version) return res.status(404).json({ error: 'version not found' })
  try {
    const artifact = await runArtifact(req.params.artifact, version)
    if (artifact.payload.statements) {
      const docs = artifact.payload.statements.map((statement, index) => ({ ...statement, sid: `${req.params.artifact}-${version.versionNumber}-${Date.now()}-${index}`, releaseVersionId: version._id, inputFingerprint: JSON.stringify(artifact.inputFingerprint), promptVersion: artifact.promptVersion, model: artifact.model }))
      await Statement.insertMany(docs)
    }
    res.json(artifact)
  } catch (error) { await AuditLog.create({ action: 'ai_validation_failed', artifact: req.params.artifact, rawResponse: error.raw, releaseVersionId: version._id }); res.status(error.status || 500).json({ error: error.message }) }
}))
router.get('/:id/versions/:v/statements', safe(async (req, res) => { const version = await current(req.params.id, Number(req.params.v)); if (!version) return res.status(404).json({ error: 'version not found' }); res.json(await Statement.find({ releaseVersionId: version._id }).sort({ createdAt: 1 })) }))
router.get('/:id/compare', safe(async (req, res) => { const [from, to] = await Promise.all([current(req.params.id, Number(req.query.from)), current(req.params.id, Number(req.query.to))]); if (!from || !to) return res.status(404).json({ error: 'versions not found' }); res.json(versionDiff(from, to)) }))
router.post('/:id/versions/:v/finalize', requireHumanSession, safe(async (req, res) => {
  const version = await current(req.params.id, Number(req.params.v)); if (!version) return res.status(404).json({ error: 'version not found' })
  const issues = checkReadiness(version); if (issues.some(issue => issue.severity === 'critical')) return res.status(409).json({ error: 'release is not ready', issues })
  version.status = 'final'; version.frozenAt = new Date(); await version.save(); res.json({ ...version.toObject(), finalizedBy: req.actorId })
}))
router.get('/:id/versions/:v/final-brief', safe(async (req, res) => { const version = await current(req.params.id, Number(req.params.v)); if (!version) return res.status(404).json({ error: 'version not found' }); if (version.status !== 'final') return res.status(409).json({ error: 'version is not final' }); res.json({ statements: await Statement.find({ releaseVersionId: version._id, status: 'approved' }) }) }))

export default router
