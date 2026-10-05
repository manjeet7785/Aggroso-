// index.js
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import pino from 'pino'
import { connectDb } from './db.js'
import releaseRoutes from './routes/releaseRoutes.js'
import statementRoutes from './routes/statementRoutes.js'
import authRoutes from './routes/authRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import { attachSession } from './middleware/auth.js'

const logger = pino({ name: 'atlas-api' })
export const app = express()

const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map(o => o.trim())
  : []

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    if (
      allowedOrigins.includes(origin) ||
      origin.startsWith('http://localhost') ||
      origin.startsWith('http://127.0.0.1') ||
      origin.endsWith('.vercel.app') ||
      process.env.NODE_ENV !== 'production'
    ) {
      return callback(null, true)
    }
    return callback(null, true)
  },
  credentials: true
}))

app.use(express.json({ limit: '1mb' }))
app.use(attachSession)

app.get('/health', (req, res) => res.json({ ok: true }))

app.use('/api/auth', authRoutes)
app.use('/api/releases', releaseRoutes)
app.use('/api/statements', statementRoutes)
app.use('/api/admin', adminRoutes)

app.use(
  ['/api/deploy', '/api/approve-release', '/api/publish'],
  (req, res) => res.sendStatus(404)
)

app.use((error, req, res, next) => {
  logger.error({ error: error.message }, 'request failed')
  res.status(error.status || 500).json({ error: error.message })
})

if (process.env.NODE_ENV !== 'test') {
  connectDb()
    .then(() => {
      console.log('mongodb connected')
      const PORT = process.env.PORT || 5000
      const server = app.listen(PORT, () => console.log(`port ${PORT}`))
      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.warn(`Port ${PORT} in use, retrying on port ${Number(PORT) + 1}...`)
          server.close()
          app.listen(Number(PORT) + 1, () => console.log(`port ${Number(PORT) + 1}`))
        } else {
          console.error('Server listen error:', err)
        }
      })
    })
    .catch((error) => {
      logger.error({ error: error.message }, 'database connection failed')
      process.exit(1)
    })
}