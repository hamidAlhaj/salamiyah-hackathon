# Compliance checklist — B4F final submission guide (9 pages)

Project and team: **«أثر» / Athar**.

Source: «B4F Hackathon — متطلبات توثيق وتسليم المشروع النهائي» (official student guide, 9 pages). Deadline: **Tuesday
24 November 2026, 16:00 (Damascus)**. State on branch `docs-submission`, 2026-11-23.

Status: **done** = in the repo with evidence · **TODO-team** = teammates must do it (code is being edited by them, or it
needs their accounts) · **needs human** = a decision, a name or an account only a person can give.

## Page 1 — General rule

| Requirement | Evidence | Status |
|---|---|---|
| Backend + Frontend + Mobile, all three, in **one** repository | `backend/` (NestJS), `frontend/` (Next.js), `mobile/` (Expo) in `hamidAlhaj/salamiyah-hackathon` | done |

## Page 2 — Project Brief (Word, one page each)

| Requirement | Evidence | Status |
|---|---|---|
| `اسم-الفريق_ملخص-المشروع.docx`, max 1 page | `docs/submission/أثر_ملخص-المشروع.docx` — Word reports **1 page** (PDF check in `docs/submission/pdf/`) | done |
| `TeamName_ProjectBrief_EN.docx`, 1 page, same information | `docs/submission/Athar_ProjectBrief_EN.docx` — **1 page** | done |
| Project name and summary · problem and solution · audience and main features · technologies (NestJS, Next.js, React Native) | both briefs, sections 1–4 | done |
| Team members: name, role, main contribution | table with the five members, roles and contributions given by the team leader | done |
| GitHub username of every member | @hamidAlhaj · @RamiAlshaar · @Badr-pixel-netizen · @Yousef2001yousef · @nawarhasan55 (repo collaborators via the GitHub API; Nawar's invitation is still pending) | done — Nawar must accept the invitation |
| English spelling of the members' names | GitHub display names: Hamid Alhaj, Rami Alshaar, Badr Aljerf, Nawar Hasan; Yousef has no display name, so "Yousef Yousef" follows the username | done (Yousef: confirm) |
| Repository link and demo link | repo URL filled; demo: "no public URL, live demo on the local network (DEMO.md)" | done (add a URL if one appears) |
| Team name in the file names | «أثر» / Athar in the file names and the documents (`build-docx.cjs --team-en Athar --team-ar أثر`) | done |
| Contributions written in the brief must match the Git history | `main` has one author (`hamidAlhaj`); `RamiAlshaar` created `codex/b4f-session-20261123` but most of its commits are authored "Codex", not his account | **TODO-team** (each member commits their own work from their account: security report, PowerPoint, frontend, mobile testing) |

## Page 3 — Analysis & Design study (Word, 4–5 pages preferred, max 10)

| Requirement | Evidence | Status |
|---|---|---|
| `اسم-الفريق_الدراسة-التحليلية-والتصميمية.docx` | `docs/submission/أثر_الدراسة-التحليلية-والتصميمية.docx` — **5 pages** (incl. diagrams; ERD on its own landscape page) | done |
| `TeamName_AnalysisDesign_EN.docx` | `docs/submission/Athar_AnalysisDesign_EN.docx` — **5 pages** | done |
| System Overview (problem, goal, audience, scope, out of scope) | section 1 | done |
| Actors / User Roles | section 2 (6 roles + public visitor) | done |
| Functional Requirements | section 3 (FR1–FR14) | done |
| Non-Functional Requirements | section 4 (security, privacy, performance, usability, reliability, responsiveness, maintainability) | done |
| ≥ 3 use cases with scenarios + use case diagram | section 5 (UC1–UC3) + `docs/diagrams/use-cases.png` | done |
| Architecture diagram (Next.js, NestJS, React Native, DB, external services) | section 6 + `docs/diagrams/architecture.png` | done |
| ERD with entities, relations, PKs, FKs | section 7 + `docs/diagrams/erd.png` (21 models) | done |
| Security & Authentication (auth, roles, hashing, endpoint protection, validation) | section 8 | done |
| Optional: Business Rules · Main Data Flow | section 9 (rules); data flow in `docs/diagrams/donation-sequence.png` and the System Map | done |

## Page 4 — Repository structure and contributions

| Requirement | Evidence | Status |
|---|---|---|
| `README.md`, `backend/`, `frontend/`, `mobile/`, `docs/`, `.gitignore` | renamed with history (`git mv`, commit `159edd4` on `main`); every check and the e2e scenario green after the rename | done |
| Each member uses their own GitHub account; appears as a contributor; `git config user.email` linked to it | one author (`hamidAlhaj`) for every commit so far | **TODO-team** |
| No one pushes the whole team's code under their name; avoid squash merges | — | **TODO-team** (each member's remaining work from their own account, PR + merge commit) |
| Repository public, or the reviewer added as collaborator | the GitHub API returns 404 without login ⇒ private | **needs human** (owner) |

## Page 5 — README content

| Requirement | Evidence | Status |
|---|---|---|
| Overview · Project Structure · Installation · Backend/Frontend/Mobile setup & run · Database migration & seed · Demo accounts | `README.md` §§ intro, 1–8 | done |
| Team Members (name, role, contribution, GitHub) matching the brief and Git | missing | **TODO-team (teammates are editing code)** |
| Main Features · Tech Stack · Prerequisites · Environment Variables (as named sections) | **Main Features** section added (incl. the general council fund); Tech Stack / Prerequisites / Environment Variables still under other headings (Repository layout, Install once, steps 4–6) | partly done — TODO-team (rename headings) |
| Backend API Overview (method + path by domain) | README **Backend API Overview**: all 103 endpoints by domain, generated from the Postman collection, 🔒 marks protected ones | done |
| Swagger Documentation · Postman Collection sections | missing — link `/api/docs` and `docs/postman/` | **TODO-team (teammates are editing code)** |
| Demo URL · Mobile APK / Expo link · Known Limitations | missing | **TODO-team** + needs human (APK needs an Expo account) |

## Page 6 — Run instructions

| Requirement | Evidence | Status |
|---|---|---|
| Backend: install, `start:dev`, real migration + seed commands | `README.md` §3–4 (`npx prisma migrate dev`, `npm run seed`, `npm run demo:reset`) | done  |
| Frontend: install, `dev` | `README.md` §5 | done |
| Mobile: install, `npx expo start` | `README.md` §6 | done |
| APK or Expo link for reviewers | none (`eas.json` absent) | **TODO-team** / **needs human** (Expo account for `eas build -p android --profile preview`) |

## Page 7 — Environment files and demo accounts

| Requirement | Evidence | Status |
|---|---|---|
| `backend/.env.example`, `frontend/.env.example`, `mobile/.env.example` | same paths — all variables, placeholders only | done |
| No real values or secrets; `NEXT_PUBLIC_` / `EXPO_PUBLIC_` prefixes | no secrets; web has no browser-side variables by design (server-only API URL); mobile uses `EXPO_PUBLIC_*` | done |
| No DB passwords, JWT secrets, keys in Git | `.env` ignored; only `.env.example` tracked; collection has no token | done |
| Demo accounts with real demo passwords in README | `README.md` §8 (7 fictional accounts, `Majlis@2026`), also `DEMO.md` and `docs/postman/README.md` | done |
| Demo accounts created by a seed script | `backend/prisma/seed` + `npm run demo:reset` | done |

## Page 8 — API documentation

| Requirement | Evidence | Status |
|---|---|---|
| README "Backend API Overview" grouped by domain | README section, same 17 domains as the Postman folders | done |
| Swagger with `@nestjs/swagger` at `/api/docs` | `backend/src/main.ts` → `/api/docs` (UI answers 200); 103 endpoints, all tagged | done |
| Swagger documents DTOs, auth, bodies, responses, main errors | bodies + auth complete; **384 gaps** (103 endpoints) (85 responses without schema, 400/401/403/404 undocumented) — `docs/swagger-audit.md` lists file:line and the decorator for each | **TODO-team (teammates are editing code)** |
| Postman Collection v2.1 | `docs/postman/salamiyah-hackathon.postman_collection.json` (schema v2.1.0) | done |
| `{{baseUrl}}` / `{{token}}` variables, no hardcoded values | collection variables; Bearer `{{token}}` at collection level; login saves the token | done |
| All backend endpoints | 103 / 103 (`docs/postman/tools/compare-endpoints.cjs`), incl. the two fund endpoints | done |
| Request examples, bodies, authentication | bodies from the DTO schemas; 36/36 main-flow requests pass (`run-collection.cjs`) | done |
| Folders match the README API overview | 17 domain folders, listed in `docs/postman/README.md` (README section still to add) | done (README side TODO-team) |
| No secrets or real tokens | checked: no JWT, no real phone numbers | done |
| Suggested path `docs/postman/<project-name>.postman_collection.json` | `docs/postman/salamiyah-hackathon.postman_collection.json` | done |

## Page 9 — Final submission list

| Item | Evidence | Status |
|---|---|---|
| 1–2 Project Brief AR + EN | `docs/submission/أثر_ملخص-المشروع.docx`, `Athar_ProjectBrief_EN.docx` | done |
| 3–4 Analysis & Design AR + EN | `docs/submission/أثر_الدراسة-التحليلية-والتصميمية.docx`, `Athar_AnalysisDesign_EN.docx` | done |
| 5 GitHub repository link | https://github.com/hamidAlhaj/salamiyah-hackathon (private now) | needs human (visibility) |
| 6 Demo URL if available | none — live LAN demo stated in the briefs | done (optional) |
| 7 Short demo video (optional) | none | TODO-team (optional) |
| Repo: README, three folders, Swagger, Postman, three `.env.example`, demo accounts, seed, APK/Expo link, clear Git history for every member | see rows above | partly done |

## Extra material in this branch (not required by the guide)

- `docs/diagrams/` — architecture, ERD, use cases, donation sequence, donation states, five System Map figures (SVG + PNG).
- `docs/system-map/` — System Construction Map in the style of the B4F Board map, EN + AR (Markdown + 9-page PDFs).
- `docs/swagger-audit.md` — the Swagger fix list for a teammate.
