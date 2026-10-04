import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../src/index.js'

describe('route policy', () => {
  it.each(['/api/deploy', '/api/approve-release', '/api/publish'])('returns 404 for %s', async path => { await request(app).post(path).expect(404) })
  it('reports health', async () => { await request(app).get('/health').expect(200) })
})
