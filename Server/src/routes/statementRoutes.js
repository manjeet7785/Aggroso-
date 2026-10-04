import express from 'express'
import { Statement } from '../models/Statement.js'
import { authenticate } from '../middleware/auth.js'
import { requireHumanSession } from '../middleware/humanSession.js'

const router = express.Router()
const safe = handler => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)
router.use(authenticate)
router.patch('/:sid', safe(async (req, res) => { const statement = await Statement.findOne({ sid: req.params.sid }); if (!statement) return res.status(404).json({ error: 'statement not found' }); if (statement.status === 'approved') return res.status(409).json({ error: 'approved statements must be rejected before editing' }); statement.text = req.body.text ?? statement.text; statement.humanEdited = true; await statement.save(); res.json(statement) }))
router.post('/:sid/approve', requireHumanSession, safe(async (req, res) => { const statement = await Statement.findOneAndUpdate({ sid: req.params.sid }, { status: 'approved' }, { new: true }); if (!statement) return res.status(404).json({ error: 'statement not found' }); res.json(statement) }))
router.post('/:sid/reject', requireHumanSession, safe(async (req, res) => { const statement = await Statement.findOneAndUpdate({ sid: req.params.sid }, { status: 'rejected' }, { new: true }); if (!statement) return res.status(404).json({ error: 'statement not found' }); res.json(statement) }))
export default router
