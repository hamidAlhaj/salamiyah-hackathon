# B4F final submission checklist

Project and team **Athar / أثر**. Reviewed on 24 November 2026 against the nine-page B4F final submission guide.

| Guide pages | Requirement | Status |
|---|---|---|
| 1, 4 | One repository with backend, frontend, mobile, docs, README and gitignore | Present. Each app has its own npm lockfile. |
| 2 | One-page Arabic and English Word briefs | Present. Both cover the problem, solution, audience, features, stack, team and repository link. |
| 3 | Arabic and English Word studies, ideally 4–5 pages each, maximum 10 | Present. Both cover scope, roles, functional and non-functional requirements, three use cases, architecture, ERD and security. |
| 3 | ERD with main entities, relationships, primary keys and foreign keys | Present. Checked against all 21 Prisma models. Includes the optional Case–Campaign relation and all 15 foreign keys targeting User. |
| 4 | Individual Git history and reviewer access | Team entries are documented. The available history does not show a commit attributable to Nawar. The owner must verify reviewer access on GitHub. |
| 5–7 | README setup for all apps, migration, seed and fictional demo accounts | Present. The three environment templates and Arabic demo walkthrough are included. |
| 6, 9 | Shareable APK or Expo link | Pending. Local Expo and LAN instructions are in the README and demo walkthrough. |
| 8 | Swagger with requests, responses, authentication and errors | UI and OpenAPI JSON are available. Some response schemas and error codes are still missing. See the [Swagger audit](swagger-audit.md). |
| 8 | Postman Collection v2.1 for every route | 106 controller routes matched. The collection uses base URL and token variables. |
| 9 | Demo URL if available and optional demo video | The documented demo runs locally on the LAN. |

[Word files and PDF copies](submission/README.md) · [Database ERD](diagrams/erd.svg) · [Project README](../README.md) · [Demo walkthrough](../DEMO.md)
