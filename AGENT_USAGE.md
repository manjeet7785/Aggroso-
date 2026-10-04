# Agent Usage — Atlas Release Platform

This document records how AI coding agents were used during development, including tools, representative prompts, delegated tasks, notable mistakes, and verification methods.

---

## Table of Contents

- [Tools Used](#tools-used)
- [Representative Prompts](#representative-prompts)
- [Delegated Work](#delegated-work)
- [Agent Mistakes & Rejected Suggestions](#agent-mistakes--rejected-suggestions)
- [Verification Methods](#verification-methods)

---

## Tools Used

| Tool / Agent        | Purpose                                           |
|---------------------|---------------------------------------------------|
| **Antigravity IDE** | Primary AI coding assistant for code generation, debugging, and project scaffolding |
| **Claude Opus 4.6** | Underlying LLM model used for reasoning and code generation |
| **File Editor**     | Direct file creation and editing via `write_to_file`, `replace_file_content`, `multi_replace_file_content` |
| **Terminal Runner** | Command execution for `npm install`, `npm test`, port management, process control |
| **File Viewer**     | Codebase exploration and understanding via `view_file`, `list_dir` |
| **Grep Search**     | Pattern matching across codebase via `grep_search` for import tracing and bug hunting |

---

## Representative Prompts

### Debugging Prompts

1. **Import path resolution**
   > "App.jsx:9 GET http://localhost:5173/src/features/release/pages/PackageEditor.jsx net::ERR_ABORTED 500 (Internal Server Error)"

   *Resolution:* Agent traced the import chain and found `PackageEditor.jsx` and `GeneratedArtifacts.jsx` were importing from `'../../../api'` instead of `'../api'`. Fixed the relative paths.

2. **Undefined component reference**
   > "App.jsx:143 Uncaught ReferenceError: Landing is not defined"

   *Resolution:* Agent identified that `PublicNav`, `Landing`, and `About` components were referenced in JSX but only had a placeholder comment. Created full component implementations matching the existing CSS design system.

3. **JSX syntax error**
   > "VersionCompare.jsx:1 Failed to load resource: the server responded with a status of 500"

   *Resolution:* Agent found `justify-content` (CSS kebab-case) used in an inline style object instead of `justifyContent` (JSX camelCase). Fixed the property name.

4. **Port conflict**
   > "Error: listen EADDRINUSE: address already in use :::5000"

   *Resolution:* Agent attempted to kill the blocking process using `taskkill /F /IM node.exe` and guided the user on manual cleanup when shell drive-mapping issues prevented automated execution.

### UI / Feature Prompts

5. **UI layout fix**
   > "iski ui thik kijiye" / "phle iski ui aise this full screen"

   *Resolution:* Agent reviewed the workspace layout and adjusted component rendering to restore full-screen workspace behavior.

6. **Feature comparison fix**
   > "compare me ye kya open ho rha hai isme to jo release h vo compare hona chahiye na"

   *Resolution:* Agent rewrote the `VersionCompare.jsx` component to properly fetch and compare release versions using the API, with side-by-side category comparison and change highlighting.

### Documentation Prompts

7. **Project documentation**
   > "README.md: setup, architecture, completed and excluded scope, tests, limitations, and deployment details. AGENT_USAGE.md: tools, prompts, delegated work... .env.example"

   *Resolution:* Agent explored the entire codebase structure, read all source files, and generated comprehensive documentation.

---

## Delegated Work

### What the agent built or significantly modified

| Component / File                    | Work Done                                              |
|-------------------------------------|--------------------------------------------------------|
| `Client/src/App.jsx`               | Added `PublicNav`, `Landing`, `About` components; fixed routing references |
| `Client/src/features/release/pages/PackageEditor.jsx` | Fixed import path (`../../../api` → `../api`) |
| `Client/src/features/release/pages/GeneratedArtifacts.jsx` | Fixed import path (`../../../api` → `../api`) |
| `Client/src/features/release/pages/VersionCompare.jsx` | Fixed JSX style property (`justify-content` → `justifyContent`); structural rewrite for version comparison |
| `README.md`                         | Complete project documentation                         |
| `AGENT_USAGE.md`                    | This file — agent usage documentation                  |
| `.env.example`                      | Environment variable template (no secrets)             |

### What was kept as-is (human-authored)

| Component / File                    | Notes                                                  |
|-------------------------------------|--------------------------------------------------------|
| Server backend (all routes, models, middleware) | Original architecture preserved |
| `Client/src/App.css`               | Full design system (26KB) — untouched                  |
| `Client/src/features/release/api.js` | API client — original code                           |
| `Server/src/ai/agentLoop.js`       | NVIDIA integration + fallback engine — original        |
| `Server/src/domain/release/*`      | Domain logic (readiness, claims, diff) — original      |
| `Server/test/*`                     | All test files — original                              |

---

## Agent Mistakes & Rejected Suggestions

### 1. Shell drive mapping failures (G: drive)
**Issue:** The agent repeatedly attempted to run shell commands (`netstat`, `taskkill`, `cmd /c`) with the working directory set to `G:\Aggors\Project`. PowerShell threw `DriveNotFoundException` because the mapped G: drive was not accessible from the agent's shell context.

**Impact:** Multiple failed attempts to automatically kill the process occupying port 5000. The user had to manually run `taskkill /F /IM node.exe`.

**Lesson:** On systems with mapped/network drives, fallback to a `C:\` working directory or instruct the user to run commands manually.

### 2. Initial placeholder comment instead of components
**Issue:** During an earlier session, the agent left a placeholder comment (`// ... (Keep PublicNav, Landing, About, Auth as they are from your monolith) ...`) in `App.jsx` instead of generating the actual component code. This caused a runtime `ReferenceError`.

**Impact:** The app crashed on load until the components were properly implemented in a follow-up fix.

**Lesson:** Never leave placeholder comments that reference components used in JSX — always generate the actual implementation.

### 3. Wrong import depth assumption
**Issue:** Files `PackageEditor.jsx` and `GeneratedArtifacts.jsx` were generated with `import { releaseApi } from '../../../api'` — three levels up — when the actual `api.js` file was only one level up at `features/release/api.js`.

**Impact:** Vite returned 500 errors because the import resolved to a nonexistent file.

**Lesson:** Always verify the file tree before generating relative import paths.

---

## Verification Methods

### Code Verification

| Method                | Description                                            |
|-----------------------|--------------------------------------------------------|
| **File inspection**   | Used `view_file` to read every source file before making changes, ensuring edits match the existing codebase |
| **Grep search**       | Used `grep_search` to trace import chains (e.g., searching for `releaseApi` across all `.js`/`.jsx` files to find correct paths) |
| **Directory listing** | Used `list_dir` to confirm file locations before writing import statements |
| **Error message analysis** | Parsed exact error messages (stack traces, line numbers) from user reports to pinpoint issues |

### Runtime Verification

| Method                | Description                                            |
|-----------------------|--------------------------------------------------------|
| **Process management**| Used `run_command` to check port usage, kill blocking processes, and verify server state |
| **Test suite**        | Server has 3 test files run via `npm test` (Vitest): domain logic, route policy, and transform security |
| **Dev server**        | Vite dev server with HMR provides immediate feedback on JSX syntax errors (500 errors for invalid files) |

### Documentation Verification

| Method                | Description                                            |
|-----------------------|--------------------------------------------------------|
| **Codebase audit**    | Read every file in the project (models, routes, middleware, AI module, domain logic, tests, configs) before writing README |
| **Dependency check**  | Read `package.json` files to accurately list the tech stack and versions |
| **Env inspection**    | Read actual `.env` to create `.env.example` with correct variable names but no secrets |

---

## Summary

The AI agent was primarily used for:
1. **Debugging** — tracing import errors, fixing JSX syntax issues, resolving port conflicts
2. **Component generation** — building missing UI components that matched the existing design system
3. **Documentation** — generating comprehensive project docs from codebase analysis

Human review and manual intervention was required for:
1. Shell commands on mapped drives (port management)
2. Final verification of UI rendering in the browser
3. Approval of generated component designs
