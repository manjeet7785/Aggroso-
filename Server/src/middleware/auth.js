import jwt from 'jsonwebtoken'
import { User } from '../models/User.js'

function tokenFrom(req) { return req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null }
export async function attachSession(req, res, next) {
  const token = tokenFrom(req)
  if (!token) return next()
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'development-only-secret')
    const user = await User.findById(payload.sub).lean()
    if (user?.active) { req.user = user; req.session = { actorId: user._id.toString() } }
  } catch { /* invalid optional tokens remain anonymous */ }
  next()
}
export function authenticate(req, res, next) { if (!req.user) return res.status(401).json({ error: 'authentication required' }); next() }
export function requireRole(...roles) { return (req, res, next) => roles.includes(req.user?.role) ? next() : res.status(403).json({ error: 'insufficient role' }) }
export function signUser(user) { return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET || 'development-only-secret', { expiresIn: process.env.JWT_EXPIRY || '7d' }) }
