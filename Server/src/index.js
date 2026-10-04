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

const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173'
app.use(cors({ origin: clientOrigin, credentials: true }))
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
      app.listen(PORT, () => console.log(`port ${PORT}`))
    })
    .catch((error) => {
      logger.error({ error: error.message }, 'database connection failed')
      process.exit(1)
    })
}