# Atlas — Release Communication Platform

Atlas helps product teams prepare, review, and publish release briefs — backed by evidence, powered by AI, and approved by humans.

---

## Table of Contents

- [Setup](#setup)
- [Architecture](#architecture)
- [Completed Scope](#completed-scope)
- [Excluded Scope](#excluded-scope)
- [Tests](#tests)
- [Limitations](#limitations)
- [Deployment](#deployment)

---

## Setup

### Prerequisites

| Tool      | Minimum Version |
|-----------|-----------------|
| Node.js   | ≥ 20            |
| npm       | ≥ 9             |
| MongoDB   | Atlas cloud or local ≥ 6 |

### 1. Clone the repository

```bash
git clone <repo-url>
cd Project
```

### 2. Server setup

```bash
cd Server
cp .env.example .env       # fill in real credentials (see .env.example for required keys)
npm install
```

### 3. Client setup

```bash
cd Client
cp .env.example .env       # adjust API URL if server runs on a different host/port
npm install
```

### 4. Run in development

**Terminal 1 — Server**

```bash
cd Server
npx nodemon index.js       # or: npm run dev
```

**Terminal 2 — Client**

```bash
cd Client
npm run dev                 # Vite dev server on http://localhost:5173
```

### 5. Run tests

```bash
cd Server
npm test                    # vitest run
```

---

## Architecture

```
Project/
├── Client/                     # React SPA (Vite + React 19)
│   └── src/
│       ├── App.jsx             # Root component with routing, auth, workspace
│       ├── App.css             # Complete design system (teal/cream/gold palette)
│       ├── main.jsx            # React entry point with QueryClientProvider
│       └── features/
│           └── release/
│               ├── api.js      # Axios client — authApi + releaseApi
│               └── pages/
│                   ├── PackageEditor.jsx      # CRUD for release package facts
│                   ├── EvidencePage.jsx        # QA/test evidence management
│                   ├── GeneratedArtifacts.jsx  # AI statement generation & review
│                   ├── VersionCompare.jsx      # Side-by-side version diff
│                   └── FinalBrief.jsx          # Approved-only brief export
│
└── Server/                     # Express + MongoDB (ESM, Node ≥ 20)
    ├── src/
    │   ├── index.js            # Express app, CORS, route mounts
    │   ├── db.js               # Mongoose connection helper
    │   ├── models/
    │   │   ├── User.js         # name, email, passwordHash, role, active
    │   │   ├── Release.js      # Release + ReleaseVersion (items, evidence)
    │   │   ├── Statement.js    # AI-generated statements with citations
    │   │   └── AuditLog.js     # AI call audit trail
    │   ├── routes/
    │   │   ├── authRoutes.js   # /api/auth — register, login, me
    │   │   ├── releaseRoutes.js# /api/releases — CRUD, versions, generate, finalize
    │   │   ├── statementRoutes.js # /api/statements — approve, reject, edit
    │   │   └── adminRoutes.js  # /api/admin — role management
    │   ├── middleware/
    │   │   ├── auth.js         # JWT attach, authenticate, requireRole, signUser
    │   │   ├── aiWriteBlock.js # Blocks AI from writing to protected routes
    │   │   └── humanSession.js # Ensures human actor context
    │   ├── ai/
    │   │   ├── agentLoop.js    # NVIDIA LLM integration + fallback rules engine
    │   │   └── prompts.js      # Zod schemas + prompt templates per artifact
    │   ├── domain/
    │   │   └── release/
    │   │       ├── readiness.js    # Release readiness checks
    │   │       ├── claimChecker.js # Citation/evidence verification
    │   │       ├── versionDiff.js  # Stable-ID-based version comparison
    │   │       ├── fingerprint.js  # Section hashing for staleness
    │   │       └── staleness.js    # Detect stale statements
    │   └── transforms/
    │       └── runTransform.js # Sandboxed user-defined transforms
    └── test/
        ├── releaseDomain.test.js  # Readiness, claims, diff, fingerprint
        ├── policy.test.js         # Route policy (404 for blocked paths, health check)
        └── transform.test.js      # Sandboxed transform execution + security
```

### Tech Stack

| Layer     | Technology                                         |
|-----------|----------------------------------------------------|
| Frontend  | React 19, Vite 8, TanStack React Query, Axios     |
| Styling   | Custom CSS design system (vanilla)                 |
| Backend   | Express 4, Node.js ≥ 20 (ESM)                     |
| Database  | MongoDB Atlas (Mongoose 8)                         |
| Auth      | JWT (jsonwebtoken) + bcryptjs                      |
| AI        | NVIDIA NIM API (Llama 3.1 70B) + fallback engine   |
| Validation| Zod                                                |
| Logging   | Pino                                               |
| Testing   | Vitest + Supertest                                 |
| Linting   | oxlint                                             |

### Data Flow

```
User → Package Editor → Save facts (features, bugs, changes, QA summary, migration)
          ↓
     Evidence Page → Link QA/test results to package items
          ↓
     Generate Brief → NVIDIA LLM (or fallback engine) → AI-proposed Statements
          ↓
     Human Review → Approve / Reject each statement
          ↓
     Final Brief → Only approved statements → Copy/export
          ↓
     Version Compare → Diff between any two version snapshots
```

---

## Completed Scope

### Authentication & Authorization
- [x] User registration with hashed passwords (bcryptjs)
- [x] JWT-based login with configurable expiry
- [x] Role-based access control: `admin`, `employee`, `client`
- [x] Route-level role guards (`requireRole` middleware)
- [x] AI write-block middleware prevents AI from modifying protected resources

### Release Package Management
- [x] Create/list releases
- [x] Multi-version support per release (draft → in_review → final)
- [x] Structured package data: features, bug fixes, changed behaviour, known limitations, QA summary, migration notes
- [x] Evidence management with pass/fail/not_run status
- [x] Evidence-to-item cross-referencing via `itemRefs` and `evidenceRefs`

### AI Brief Generation
- [x] NVIDIA NIM integration (Llama 3.1 70B via structured JSON schema output)
- [x] Fallback local rules engine when NVIDIA key is absent or calls fail
- [x] Citation guard — strips hallucinated citations not found in input data
- [x] Human-in-the-loop: all AI statements start as `proposed`
- [x] Per-statement approve/reject workflow
- [x] Audit logging of every AI generation call

### Domain Logic
- [x] Release readiness checker (validates required sections, evidence coverage)
- [x] Claim verification (ensures QA evidence supports cited claims)
- [x] Version diffing (added/removed/modified items via stable IDs)
- [x] Section fingerprinting for staleness detection
- [x] Sandboxed user-defined transforms with security guards (blocks `eval`, `Function`)

### Frontend
- [x] SPA routing (history-based, no React Router dependency)
- [x] Public pages: Landing, About
- [x] Auth flow: Register / Login with form validation
- [x] Workspace with sidebar navigation (5 tabs)
- [x] Release/version selector dropdowns
- [x] Package editor with per-section item management
- [x] Evidence page with status management
- [x] AI statement cards with approve/reject actions + citation chips
- [x] Side-by-side version comparison with change highlighting
- [x] Final brief view with clipboard export

---

## Excluded Scope

The following features are **not** implemented in the current version:

- **Deployment pipeline** — `/api/deploy`, `/api/approve-release`, `/api/publish` return 404 by design
- **Email/notification system** — no email verification, password reset, or notification delivery
- **File uploads** — evidence is metadata-only; no file attachments
- **Real-time collaboration** — no WebSocket/SSE; data refreshes via React Query polling
- **Audit log viewer** — audit logs are written to DB but no admin UI to view them
- **User management UI** — admin routes exist but no frontend admin panel
- **Multi-tenancy** — single workspace; no org/team scoping
- **i18n / localization** — English only
- **Rate limiting** — no request throttling on API endpoints
- **CI/CD** — no automated build/deploy pipeline configured

---

## Tests

Tests use **Vitest** with **Supertest** for HTTP-level assertions.

```bash
cd Server
npm test
```

| Test File                  | Coverage Area                              |
|----------------------------|--------------------------------------------|
| `releaseDomain.test.js`    | Readiness checks, claim verification, version diffing, section fingerprinting |
| `policy.test.js`           | Route policy enforcement (blocked endpoints return 404, health check returns 200) |
| `transform.test.js`        | Sandboxed transform execution, security (blocks `eval` and `Function` construction) |

### What's tested
- Domain logic (readiness, claims, diffs, fingerprints) — pure functions, no DB required
- Route policy — blocked deployment/publish endpoints correctly return 404
- Health endpoint — responds 200
- Transform sandbox — executes safely, rejects unsafe code

### What's not tested
- Full integration tests requiring a live MongoDB connection
- Frontend component tests (no React Testing Library / Playwright configured)
- AI generation end-to-end (requires NVIDIA API key)
- Authentication flow integration tests

---

## Limitations

1. **Port conflicts** — The server binds to `PORT=5000` by default. If another process occupies that port, you must kill it manually (`taskkill /F /IM node.exe` on Windows) before restarting.

2. **AI dependency** — The NVIDIA NIM API key is optional but required for high-quality AI brief generation. Without it, the fallback rules engine produces simpler, template-based statements.

3. **No graceful shutdown** — The server does not implement `SIGTERM`/`SIGINT` handlers for graceful connection draining.

4. **Single-instance only** — No horizontal scaling support; MongoDB sessions and JWT are stateless but the Express server is single-process.

5. **No input sanitization beyond Zod** — While Zod validates API payloads, there is no HTML/XSS sanitization on user-provided text fields rendered in the frontend.

6. **JWT secret in env** — The `JWT_SECRET` must be changed from its default before production deployment. The default secret is insecure.

7. **No HTTPS** — The dev setup runs on plain HTTP. A reverse proxy (nginx, Caddy) is required for TLS in production.

---

## Deployment

### Production Build

**Client:**
```bash
cd Client
npm run build         # outputs to Client/dist/
```

**Server:**
```bash
cd Server
npm start             # runs node src/index.js directly (no nodemon)
```

### Environment Variables

See [`.env.example`](.env.example) at the project root for all required configuration.

### Recommended Production Setup

| Component      | Recommendation                                      |
|----------------|-----------------------------------------------------|
| Reverse proxy  | nginx or Caddy (TLS termination, static file serving)|
| Process manager| PM2 (`pm2 start src/index.js`)                      |
| Database       | MongoDB Atlas (managed) or self-hosted replica set   |
| Static assets  | Serve `Client/dist/` via nginx or a CDN              |
| Monitoring     | Pino logs → log aggregator (Datadog, Grafana Loki)   |
| Secrets        | Use environment variables or a vault; never commit `.env` |

### Docker (not included, example)

```dockerfile
# Server
FROM node:20-alpine
WORKDIR /app
COPY Server/package*.json ./
RUN npm ci --omit=dev
COPY Server/src ./src
EXPOSE 5000
CMD ["node", "src/index.js"]
```

---

## License

Private project — all rights reserved.
# Aggroso-
