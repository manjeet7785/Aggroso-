import express from 'express'
import bcrypt from 'bcryptjs'
import { User } from '../models/User.js'
import { authenticate, requireRole, signUser } from '../middleware/auth.js'

const router = express.Router()
const safe = handler => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)
router.post('/register', safe(async (req, res) => {
  const { name, email, password, role = 'client', adminCode } = req.body
  if (!name || !email || !password || password.length < 8) return res.status(400).json({ error: 'name, email, and password of 8+ characters are required' })
  if (role !== 'client' && !(role === 'admin' && adminCode && adminCode === process.env.ADMIN_INVITE_CODE)) return res.status(403).json({ error: 'role registration is restricted' })
  const exists = await User.findOne({ email: email.toLowerCase() }); if (exists) return res.status(409).json({ error: 'email already registered' })
  const user = await User.create({ name, email, role, passwordHash: await bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS || 10)) })
  res.status(201).json({ token: signUser(user), user: { id: user._id, name: user.name, email: user.email, role: user.role } })
}))
router.post('/login', safe(async (req, res) => {
  const user = await User.findOne({ email: req.body.email?.toLowerCase() }).select('+passwordHash')
  if (!user?.active || !(await bcrypt.compare(req.body.password || '', user.passwordHash))) return res.status(401).json({ error: 'invalid credentials' })
  res.json({ token: signUser(user), user: { id: user._id, name: user.name, email: user.email, role: user.role } })
}))
router.get('/me', authenticate, (req, res) => res.json({ user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role } }))
router.get('/users', authenticate, requireRole('admin'), safe(async (req, res) => res.json(await User.find().select('name email role active createdAt').sort({ createdAt: -1 }))))
router.patch('/users/:id/role', authenticate, requireRole('admin'), safe(async (req, res) => { if (!['admin', 'employee', 'client'].includes(req.body.role)) return res.status(400).json({ error: 'invalid role' }); const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true }).select('name email role active'); if (!user) return res.status(404).json({ error: 'user not found' }); res.json(user) }))
export default router
