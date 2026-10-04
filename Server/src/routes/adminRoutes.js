import express from 'express'
import { User } from '../models/User.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = express.Router()
router.get('/overview', authenticate, requireRole('admin'), async (req, res, next) => { try { const [users, active] = await Promise.all([User.countDocuments(), User.countDocuments({ active: true })]); res.json({ users, active }) } catch (error) { next(error) } })
export default router
