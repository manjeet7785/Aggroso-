export function requireHumanSession(req, res, next) {
  if (!req.session?.actorId) return res.status(401).json({ error: 'authenticated actor session is required' })
  req.actorId = req.session.actorId
  next()
}
