const blockedFields = new Set(['status', 'humanImpact', 'humanEdited', 'approval', 'approvedBy', 'approvedAt'])

function findBlocked(value, path = '') {
  if (!value || typeof value !== 'object') return []
  return Object.entries(value).flatMap(([key, child]) => {
    const nextPath = path ? `${path}.${key}` : key
    return blockedFields.has(key) ? [nextPath] : findBlocked(child, nextPath)
  })
}

export function aiWriteBlock(req, res, next) {
  const blocked = findBlocked(req.body || {})
  if (blocked.length) return res.status(403).json({ error: 'AI cannot write human-controlled fields', fields: blocked })
  next()
}
