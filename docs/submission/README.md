# Submission documents — «أثر» / Athar

The app UI still shows the earlier working name «مجلس فند»; rename in progress.

The four Word files required by the B4F submission guide (pages 2–3), with the guide's exact name patterns:

| File | Limit | Pages (Word) |
|---|---|---|
| `أثر_ملخص-المشروع.docx` | 1 page | 1 |
| `Athar_ProjectBrief_EN.docx` | 1 page | 1 |
| `أثر_الدراسة-التحليلية-والتصميمية.docx` | 4–5 preferred, max 10 | 5 (ERD on a landscape page) |
| `Athar_AnalysisDesign_EN.docx` | 4–5 preferred, max 10 | 5 (ERD on a landscape page) |

`pdf/` holds the PDF that Word exported from each file, to check the page count, RTL and the diagrams.

## Filled in (2026-11-23)

- Project and team name: «أثر» / Athar, in the file names and inside the documents (the briefs and the analysis
  overview add that the app UI still shows «مجلس فند» while the rename is in progress).
- Members, roles and contributions from the team leader. English names = GitHub display names; usernames = the
  repository's collaborators (GitHub REST API). Yousef has no GitHub display name: "Yousef Yousef" follows the
  username `Yousef2001yousef`. Nawar (`nawarhasan55`) has a pending collaborator invitation.
- Demo URL: no public URL; the briefs point to the live LAN demo (`DEMO.md`).
- Text lives in `tools/content.cjs`; diagrams come from `docs/diagrams/*.png`.

## Rebuild (Windows + Microsoft Word, no dependencies)

```powershell
node docs/submission/tools/build-docx.cjs --team-en Athar --team-ar أثر --label-en Athar --label-ar أثر
```

The script writes Word-flavoured HTML, lets Word (COM, `tools/html-to-docx.ps1`) embed the pictures and save
`.docx` + `.pdf`, and fails if a file goes over its page limit. Defaults are Athar / أثر; delete old files by hand if the name ever changes again.
