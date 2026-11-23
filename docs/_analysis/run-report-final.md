# Final run report — 24 November 2026 (deadline 16:00 Asia/Damascus)

Start: about 00:45 Damascus time. `main` at `2901304`, working tree clean (an untracked review draft of my own was
moved out of the repo first). `origin/codex/b4f-session-20261123` is left untouched and not merged.

## Step 1 — rename to `backend/` and `frontend/` · branch `p25-rename`

- `git mv api backend` and `git mv web frontend` in one commit (history preserved; git-ignored local files such as
  `.env`, `uploads/` and `node_modules` moved with the folders on this machine and were not committed).
- Path-sensitive places updated: `.gitignore` (`backend/uploads/`), `scripts/demo-start.ps1`, the e2e config, helpers
  and tests (`06-google-signin` reads `backend/.env`), the shared-copy sync tests (`frontend/src/shared/shared.test.ts`,
  `backend/src/common/shared/shared.spec.ts`, `backend/src/notifications/links.spec.ts`), comments in the three
  byte-identical `enums.ts` copies and other source comments, `README.md` (layout, commands, project column),
  `DEMO.md`, `CLAUDE.md`. Routes such as `/api/docs` and the `lib/api/` folder are unchanged.
- `grep` for old `api/` and `web/` paths outside `docs/_analysis`, `docs/analysis` and `docs/input`: none left.
- Checks (clean `npm ci` in backend and frontend):

| Project | lint | tests | build / types |
|---|---|---|---|
| backend | ✔ | ✔ 31 suites / 392 tests | ✔ `nest build` |
| frontend | ✔ | ✔ 13 files / 53 tests | ✔ `next build` |
| mobile | ✔ `expo lint` | — | ✔ `tsc --noEmit` |
| e2e (after `demo:reset`, API restarted, production web) | — | ✔ 40 passed, 1 skipped (LAN test, needs `E2E_LAN_URL`), 0 failed | — |

  Note: the Playwright process did not exit after the last test (browser close); it was stopped by hand after all
  results were printed.

## Step 2 — merge `docs-submission` into `main`

- `git merge --no-ff origin/docs-submission`: no conflicts (the branch only touched `docs/`).
- Old `api/` / `web/` paths inside the merged docs and tools changed to `backend/` / `frontend/`:
  `docs/postman/tools/compare-endpoints.cjs` (now reads `backend/src`), `docs/tools/swagger-audit.cjs`,
  `docs/postman/README.md`, `run-collection.cjs`, the system map (EN/AR), diagram labels, the swagger audit and the
  compliance checklist (folder structure row now **done**, commit `159edd4`). Next.js route handlers under
  `app/api/…` in the frontend map are real route names and stay.
- Re-run: `compare-endpoints.cjs` → 101 controllers = 101 collection requests; `swagger-audit.cjs` → 101 endpoints,
  376 gaps (unchanged); diagrams rebuilt; system map EN 9 / AR 9 pages; Word files rebuilt: Athar briefs 1 + 1 page,
  analysis 5 + 5 pages.
- Application code is unchanged by this step, so the Step 1 checks (lint, 392 + 53 tests, builds, e2e 40 passed /
  1 skipped) still apply.
