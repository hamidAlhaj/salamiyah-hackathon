# Claude Code prompt — registration, council fund, and B4F final delivery

Work in the current Salamiyah donations repository. Implement the following addition to the earlier redesign and cleanup brief. Preserve working features, the Arabic/English interfaces, role checks, existing records, uncommitted work, and the shared Nest API used by Next and React Native. Read this prompt and the five numbered handoffs first. In a member's checkout, implement that member's assigned slice; use the other handoffs as contracts. Integration and final audit happen after the slices are merged.

## 1. Agree the money contract before building screens

Hamid leads the foundation handoff. Inspect the actual schema and migrations, payment instructions, pledges, verifications, receipts, expenditures and ledger, then publish a small working foundation diff and concrete request/response examples for the team to review. Record the current commit as the starting point. This repository already has history. Hamid's first *new* contribution can be the fund schema and contract; earlier work retains its original authorship.

Implement a first-class general council fund with balances per currency, an authorized receiving account for each offered payment method, an audit trail and a public, anonymized summary. Support both direct donations and explicitly accepted campaign surplus. A permanent fund has no artificial target. Keep one verified monetary source of truth. A single transfer can have two allocations, but must contribute to platform collections exactly once. If campaign and fund require different receiving accounts, present distinct instructions and reconcile each actual payment; never imply one transfer reached two unrelated accounts.

For a targeted campaign, compute the remaining need on the server using exact decimal arithmetic and verified allocations in that currency. Document any reservation policy. Preview the proposed allocation before a pledge or payment is made. If the donor offers more than the remaining amount, show an accessible Arabic/English notice with the offered amount, the campaign share, and the surplus going to the council fund. Require a deliberate choice:

1. Continue with the full amount and explicitly authorize the displayed campaign/fund split.
2. Donate only the amount still needed by the campaign.
3. Browse other campaigns, retaining the amount as a draft where practical.
4. Cancel.

Browsing and cancellation before payment create no financial records or change balances. When the remaining need is zero, remove the remaining-only option and offer an explicit direct fund donation or another campaign. Ordinary within-target donations keep the normal flow. Add a plainly labelled “تبرّع لصندوق المجلس العام” call to action on web home/navigation and mobile home, usable in RTL, with keyboard or screen reader. Distinguish personal confirmation from the public progress bar.

Revalidate at submission and verification. Concurrent pledges must never overfund a capped campaign or silently increase the authorized surplus. If a quote becomes stale before payment, show the revised split for confirmation. If money has already been received and its allocation can no longer be honored, record the real receipt once and put the unallocated difference into a traceable reconciliation state pending the donor's decision. Do not represent it as cancelled, refunded, or donated to the fund automatically. Make retries idempotent and financial writes atomic. Preserve existing cash, transfer, and simulated flows. Keep pending and demo amounts outside verified balances. Show allocations on the receipt, donor history, finance view and confirmation, without exposing personal details publicly.

## 2. Registration and verification

Add a visible web “إنشاء حساب جديد” path from login and the guest donation prompt. Reuse Nest donor registration, phone normalization, validation and the existing HttpOnly session. Resume only an allowlisted internal campaign or fund destination. Self-registration creates a DONOR. Verify existing mobile registration and resume behavior using the same account and API. Cover duplicate phone, invalid input, server outage, cancellation, expired login and double submission.

Use a disposable PostgreSQL database and fictional accounts. With 30,000 SYP remaining and 50,000 SYP offered, test each choice independently. After full approval, expect 30,000 for the campaign, 20,000 for the fund, and a 50,000 platform increase. Remaining-only yields 30,000 and zero to the fund. Browse/cancel yields zero. Test exact target, fully funded, direct fund donation, concurrent final donations, rejection and retry, already-transferred money, two currencies, demo exclusion, and old receipts that predate the migration. Verify each resulting balance, notification and receipt. Run web, Nest, and mobile checks and record which journeys were actually exercised on a browser or device.

## 3. Final compliance audit after code integration

Read the original nine-page Arabic guide again after implementation. If the original path is unavailable on another machine, request the PDF from the team. Its local filename is:
`C:/Users/Lenovo/Downloads/Telegram Desktop/B4F_Hackathon_متطلبات_توثيق_وتسليم_المشروع_النهائي_AR.pdf`

Build a page-by-page compliance table with requirement, evidence path/link, actual test result, owner and status (verified / missing / requires human access). Complete the authorized local deliverables. Check these points against the original wording:

- Pages 1 and 4: one repository with root README.md, .gitignore, backend/, frontend/, mobile/, docs/. Current api/ and web/ are a naming gap against the literal requirement. Coordinate a single history-preserving rename in Hamid's foundation handoff if needed; update all path-sensitive scripts, tests, documentation and CI and rerun them. Do not submit duplicate source trees or declare alternative names compliant without a documented instructor decision.
- Page 2: create both Arabic and English Word project briefs, at most one page EACH, with equivalent content, project name, problem, solution, audience, features, stack, actual names, roles, primary contributions, GitHub usernames, repository URL and demo URL if available. Use the PDF's exact filename patterns and the confirmed team name.
- Page 3: create both Arabic and English analysis/design DOCX files, preferably 4–5 pages, maximum 10 pages EACH including diagrams. Include overview, scope/out of scope, actors, functional and non-functional requirements, at least three use cases with scenarios, architecture diagram, ERD with PKs/FKs, and security/authentication/authorization/hashing/validation. Render all four documents, confirm real page counts and check RTL, diagrams and readability.
- Pages 4–7: each contributor uses their own primary GitHub account and linked email. README and briefs describe actual contributions supported by Git. Verify reviewer access (public or invited, with owner authorization), prerequisites, real installation/run commands for all three apps, database migrations and seed, separate complete .env.example files with placeholders and public prefixes only where appropriate, working demo-only accounts and passwords, features, team, structure, known limitations, demo URL if available, and a usable APK or Expo link. Verify the mobile artifact from another device when possible.
- Page 8: verify Swagger at /api/docs using @nestjs/swagger, auth, DTOs, bodies, request/response schemas and main errors. Create a Postman v2.1 collection covering every actual backend method/path, grouped to match the README API overview, with examples and variables {{baseUrl}} and {{token}}. Compare its method/path inventory against the controllers after the final merge, including fund endpoints. Export no secrets.
- Page 9: verify the four correctly named DOCX files, real repository link, optional live demo URL and optional short video, reviewer-ready repository and APK/Expo link. A presentation belongs to Badr's assignment. Keep it separate from the four mandatory documents. Deadline is Tuesday 24 November 2026 at 16:00 Damascus time.

Ask the team for actual GitHub usernames, team name and external links where needed; continue independent local work meanwhile. Do not publish externally, change repository visibility, invite reviewers, send messages or act under members' identities without the relevant owner's authorization. Mark unavailable evidence openly.

## 4. Real Git contributions over two days

Use 23–24 November 2026, Asia/Damascus, as the proposed implementation window; the time blocks are planning targets only. Read handoffs 01–05. Each real member reviews, implements, tests and commits their own coherent changes using their own account, and opens their own PR when ready. Record actual timestamps, SHAs, tests and PR links only after the events happen. Preserve authors on merge, avoid squash merges that hide contributors, and do not fabricate identities, redistribute past commits, backdate commits, or manufacture activity. If a person did not complete a task, document its actual owner/status. A shared file has one merge owner; other members submit reviewed inputs.

Finish with the compliance table, actual contribution/evidence table, final test results, remaining blockers and exact submission filenames. Never claim a passing check or delivered link without evidence.
