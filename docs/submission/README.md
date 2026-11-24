# Submission documents — «أثر» / Athar

The four Word files required by the B4F submission guide (pages 2–3), with the guide's exact name patterns:

| File | Limit | Pages (Word) |
|---|---|---|
| `أثر_ملخص-المشروع.docx` | 1 page | 1 |
| `Athar_ProjectBrief_EN.docx` | 1 page | 1 |
| `أثر_الدراسة-التحليلية-والتصميمية.docx` | 4–5 preferred, max 10 | 5 (ERD on a landscape page) |
| `Athar_AnalysisDesign_EN.docx` | 4–5 preferred, max 10 | 5 (ERD on a landscape page) |

`pdf/` holds the PDF that Word exported from each file, to check the page count, RTL and the diagrams.

## Submission details

- Project and team name: «أثر» / Athar, in the file names and inside the documents.
- Team members, roles and contributions match the team table in the root README. See the submission checklist
  for Git attribution and reviewer access.
- Demo URL: no public URL; the briefs point to the live LAN demo (`DEMO.md`).
- Text lives in `tools/content.cjs`; diagrams come from `docs/diagrams/*.png`.

## Rebuild (Windows + Microsoft Word, no dependencies)

```powershell
node docs/submission/tools/build-docx.cjs --team-en Athar --team-ar أثر --label-en Athar --label-ar أثر
```

The script writes Word-flavoured HTML, lets Word (COM, `tools/html-to-docx.ps1`) embed the pictures and save
`.docx` + `.pdf`, and fails if a file goes over its page limit. Defaults are Athar / أثر; delete old files by hand if the name ever changes again.
