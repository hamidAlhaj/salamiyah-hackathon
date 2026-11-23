# Swagger audit — Athar API (`/api/docs`)

Project and team: «أثر» / Athar. The Swagger title served by the app is still `Majlis Fund API` (the earlier working name «مجلس فند»); rename in progress.

Read-only audit of the OpenAPI document served by the API (`http://localhost:4000/api/docs`, JSON at `/api/docs-json`, snapshot `docs/postman/tools/openapi.snapshot.json`, taken 2026-11-23 from `main`) against the controller sources. **No backend file was changed.** Regenerate with `node docs/tools/swagger-audit.cjs` after fixing.

## Summary

| | |
|---|---|
| Endpoints in Swagger | **103** (= 101 controller routes, see `docs/postman/tools/compare-endpoints.cjs`) |
| Tags | 19, every endpoint tagged |
| Summary (`@ApiOperation`) | 101/103 |
| Bearer auth shown on protected endpoints | 81 protected, all with the lock (`@ApiBearerAuth()` at class level) |
| Request bodies with a DTO schema | 40 (all bodies) |
| Success responses with a schema | 13/103 (file/redirect responses counted as fine) |
| Endpoints with no gap | **3/103** |
| **Gaps (endpoint × missing item)** | **384** |

| Gap kind | Count | Fix |
|---|---|---|
| schema | 87 | success response without a schema → response DTO class + `@ApiOkResponse/@ApiCreatedResponse({ type })` |
| 400 | 82 | validation error not documented |
| 401 | 81 | missing token not documented |
| 403 | 75 | role refusal not documented |
| 404 | 49 | not found not documented |
| produces | 4 | file download without `@ApiProduces` |
| success | 3 | document the success status |
| summary | 2 | add `@ApiOperation({ summary })` |
| status | 1 | documented status ≠ real status |

## Fix plan for a teammate (in this order)

1. **One error schema.** Create `backend/src/common/dto/error-response.dto.ts` with `ErrorResponseDto { statusCode: number; message: string | string[]; error: string; path: string; timestamp: string }` (each with `@ApiProperty({ example })`), the shape `AllExceptionsFilter` already returns.
2. **Class level, once per guarded controller** (next to `@ApiBearerAuth()`): `@ApiUnauthorizedResponse({ type: ErrorResponseDto, description: 'Missing/expired token' })`. This alone closes every `401` row below.
3. **Per handler:** `@ApiForbiddenResponse({ type: ErrorResponseDto })` where the service calls `requireRole`, `@ApiNotFoundResponse({ type: ErrorResponseDto })` on `:id`/`:slug` routes, `@ApiBadRequestResponse({ type: ErrorResponseDto })` on routes with a body, query or `ParseUUIDPipe`.
4. **Response DTOs** for the main reads (campaign card/detail, ledger, pledge, verification, official receipt, transparency stats, notification): small classes with `@ApiProperty`, referenced with `@ApiOkResponse({ type: X })` or `{ type: X, isArray: true }`. Start with the demo path: `GET /campaigns`, `GET /campaigns/{slug}`, `GET /campaigns/{id}/ledger`, `POST /pledges`, `POST /verifications/{id}/approve`, `GET /official-receipts/{no}`, `GET /stats/transparency`.
5. **Files:** `@ApiProduces(...)` on the file/CSV downloads.
6. Run `npm run lint; npm test; npm run build` in `backend/`, then `node docs/postman/tools/build-collection.cjs` and this script.

Gaps per controller file:

| File | Gaps |
|---|---|
| `backend/src/pledges/pledges.controller.ts` | 57 |
| `backend/src/beneficiaries/beneficiaries.controller.ts` | 41 |
| `backend/src/campaigns/campaigns.controller.ts` | 35 |
| `backend/src/cases/cases.controller.ts` | 35 |
| `backend/src/hospitals/lookups.controller.ts` | 31 |
| `backend/src/payment-methods/payment-methods.controller.ts` | 28 |
| `backend/src/expenditures/expenditures.controller.ts` | 25 |
| `backend/src/notifications/notifications.controller.ts` | 23 |
| `backend/src/categories/categories.controller.ts` | 19 |
| `backend/src/imports/imports.controller.ts` | 19 |
| `backend/src/collector/collector.controller.ts` | 18 |
| `backend/src/audit/audit.controller.ts` | 14 |
| `backend/src/verifications/verifications.controller.ts` | 14 |
| `backend/src/users/users.controller.ts` | 13 |
| `backend/src/auth/auth.controller.ts` | 7 |
| `backend/src/stats/stats.controller.ts` | 5 |

## Per endpoint

"Documented" is what `/api/docs` shows now. "Missing → add" names the decorator to put on the handler at the given line (or once on the class for 401).

### health

| Endpoint | Handler | Documented | Missing → add |
|---|---|---|---|
| `GET /health` | `backend/src/health.controller.ts:7` | tag `health` · summary · public · responses 200 | ✔ complete |

### audit

| Endpoint | Handler | Documented | Missing → add |
|---|---|---|---|
| `GET /audit` | `backend/src/audit/audit.controller.ts:14` | tag `audit` · summary · Bearer · query entityType, entityId · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole) |
| `GET /audit/campaigns/{id}` | `backend/src/audit/audit.controller.ts:26` | tag `audit` · summary · Bearer · path id · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole)<br>`@ApiNotFoundResponse({ type: ErrorResponseDto })` |
| `GET /audit/cases/{id}` | `backend/src/audit/audit.controller.ts:35` | tag `audit` · summary · Bearer · path id · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole)<br>`@ApiNotFoundResponse({ type: ErrorResponseDto })` |

### notifications

| Endpoint | Handler | Documented | Missing → add |
|---|---|---|---|
| `GET /notifications` | `backend/src/notifications/notifications.controller.ts:17` | tag `notifications` · summary · Bearer · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level) |
| `GET /notifications/unread-count` | `backend/src/notifications/notifications.controller.ts:23` | tag `notifications` · summary · Bearer · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level) |
| `POST /notifications/read-all` | `backend/src/notifications/notifications.controller.ts:29` | tag `notifications` · summary · Bearer · responses 201 | response schema: `@ApiCreatedResponse({ type: <Response>Dto })`<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level) |
| `POST /notifications/{id}/read` | `backend/src/notifications/notifications.controller.ts:35` | tag `notifications` · summary · Bearer · path id · responses 201 | response schema: `@ApiCreatedResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiNotFoundResponse({ type: ErrorResponseDto })` |

### outbox

| Endpoint | Handler | Documented | Missing → add |
|---|---|---|---|
| `GET /outbox` | `backend/src/notifications/notifications.controller.ts:50` | tag `outbox` · summary · Bearer · query template, status, page, pageSize · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole) |
| `GET /outbox/next` | `backend/src/notifications/notifications.controller.ts:58` | tag `outbox` · summary · Bearer · query template · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole) |
| `POST /outbox/{id}/opened` | `backend/src/notifications/notifications.controller.ts:64` | tag `outbox` · summary · Bearer · path id · responses 201 | response schema: `@ApiCreatedResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole)<br>`@ApiNotFoundResponse({ type: ErrorResponseDto })` |

### auth

| Endpoint | Handler | Documented | Missing → add |
|---|---|---|---|
| `POST /auth/register` | `backend/src/auth/auth.controller.ts:42` | tag `auth` · summary · public · body `RegisterDto` · responses 200/409 | documented 200 but the handler returns 201: use `@ApiCreatedResponse` or add `@HttpCode(200)`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe) |
| `POST /auth/login` | `backend/src/auth/auth.controller.ts:51` | tag `auth` · summary · public · body `LoginDto` · responses 200/401 | `@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe) |
| `GET /auth/google/enabled` | `backend/src/auth/auth.controller.ts:61` | tag `auth` · summary · public · responses 200 | ✔ complete |
| `GET /auth/google` | `backend/src/auth/auth.controller.ts:74` | tag `auth` · summary · public · query state · responses 302/400/404 | ✔ complete |
| `GET /auth/google/callback` | `backend/src/auth/auth.controller.ts:90` | tag `auth` · summary · public · query code · responses 200/401/403/404/409 | `@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe) |
| `GET /auth/me` | `backend/src/auth/auth.controller.ts:116` | tag `auth` · summary · Bearer · responses 200 | `@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level) |
| `PATCH /auth/me/phone` | `backend/src/auth/auth.controller.ts:123` | tag `auth` · summary · Bearer · body `UpdatePhoneDto` · responses 200/403/409 | `@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level) |

### categories

| Endpoint | Handler | Documented | Missing → add |
|---|---|---|---|
| `GET /categories` | `backend/src/categories/categories.controller.ts:29` | tag `categories` · summary · public · query lang · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe) |
| `POST /categories` | `backend/src/categories/categories.controller.ts:52` | tag `categories` · summary · Bearer · body `CreateCategoryDto` · responses 201 | response schema: `@ApiCreatedResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole) |
| `GET /categories/all` | `backend/src/categories/categories.controller.ts:44` | tag `categories` · summary · Bearer · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole) |
| `PATCH /categories/{id}` | `backend/src/categories/categories.controller.ts:58` | tag `categories` · summary · Bearer · body `UpdateCategoryDto` · path id · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole)<br>`@ApiNotFoundResponse({ type: ErrorResponseDto })` |
| `DELETE /categories/{id}` | `backend/src/categories/categories.controller.ts:68` | tag `categories` · summary · Bearer · path id · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole)<br>`@ApiNotFoundResponse({ type: ErrorResponseDto })` |

### campaigns

| Endpoint | Handler | Documented | Missing → add |
|---|---|---|---|
| `GET /campaigns` | `backend/src/campaigns/campaigns.controller.ts:31` | tag `campaigns` · summary · public · query category, status, priority, lang · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe) |
| `POST /campaigns` | `backend/src/campaigns/campaigns.controller.ts:76` | tag `campaigns` · summary · Bearer · body `CreateCampaignDto` · responses 201 | response schema: `@ApiCreatedResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole) |
| `GET /campaigns/{slug}` | `backend/src/campaigns/campaigns.controller.ts:39` | tag `campaigns` · summary · public · path slug · query lang · responses 404 | success response: `@ApiOkResponse({ type: … })` (the 2xx is not documented at all)<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe) |
| `GET /campaigns/{id}/ledger` | `backend/src/campaigns/campaigns.controller.ts:46` | tag `campaigns` · summary · public · path id · responses 404 | success response: `@ApiOkResponse({ type: … })` (the 2xx is not documented at all)<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe) |
| `GET /campaigns/{id}/transparency` | `backend/src/campaigns/campaigns.controller.ts:55` | tag `campaigns` · summary · public · path id · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiNotFoundResponse({ type: ErrorResponseDto })` |
| `GET /campaigns/staff/all` | `backend/src/campaigns/campaigns.controller.ts:70` | tag `campaigns` · summary · Bearer · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole) |
| `GET /campaigns/staff/{id}` | `backend/src/campaigns/campaigns.controller.ts:85` | tag `campaigns` · summary · Bearer · path id · responses 404 | success response: `@ApiOkResponse({ type: … })` (the 2xx is not documented at all)<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole) |
| `PATCH /campaigns/{id}` | `backend/src/campaigns/campaigns.controller.ts:94` | tag `campaigns` · summary · Bearer · body `UpdateCampaignDto` · path id · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole)<br>`@ApiNotFoundResponse({ type: ErrorResponseDto })` |
| `PATCH /campaigns/{id}/status` | `backend/src/campaigns/campaigns.controller.ts:107` | tag `campaigns` · summary · Bearer · body `UpdateCampaignStatusDto` · path id · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole)<br>`@ApiNotFoundResponse({ type: ErrorResponseDto })` |
| `POST /campaigns/{id}/updates` | `backend/src/campaigns/campaigns.controller.ts:117` | tag `campaigns` · summary · Bearer · body `CreateCampaignUpdateDto` · path id · responses 201 | response schema: `@ApiCreatedResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole)<br>`@ApiNotFoundResponse({ type: ErrorResponseDto })` |

### beneficiaries

| Endpoint | Handler | Documented | Missing → add |
|---|---|---|---|
| `GET /campaigns/{id}/beneficiaries` | `backend/src/beneficiaries/beneficiaries.controller.ts:32` | tag `beneficiaries` · summary · public · path id · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiNotFoundResponse({ type: ErrorResponseDto })` |
| `POST /campaigns/{id}/beneficiaries` | `backend/src/beneficiaries/beneficiaries.controller.ts:115` | tag `beneficiaries` · summary · Bearer · body `LinkBeneficiaryDto` · path id · responses 201 | response schema: `@ApiCreatedResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole)<br>`@ApiNotFoundResponse({ type: ErrorResponseDto })` |
| `GET /beneficiaries` | `backend/src/beneficiaries/beneficiaries.controller.ts:47` | tag `beneficiaries` · summary · Bearer · query q · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole) |
| `POST /beneficiaries` | `backend/src/beneficiaries/beneficiaries.controller.ts:53` | tag `beneficiaries` · summary · Bearer · body `CreateBeneficiaryDto` · responses 201 | response schema: `@ApiCreatedResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole) |
| `PATCH /beneficiaries/{id}` | `backend/src/beneficiaries/beneficiaries.controller.ts:59` | tag `beneficiaries` · summary · Bearer · body `UpdateBeneficiaryDto` · path id · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole)<br>`@ApiNotFoundResponse({ type: ErrorResponseDto })` |
| `POST /beneficiaries/{id}/suspend` | `backend/src/beneficiaries/beneficiaries.controller.ts:69` | tag `beneficiaries` · summary · Bearer · body `BeneficiaryReasonDto` · path id · responses 201 | response schema: `@ApiCreatedResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole)<br>`@ApiNotFoundResponse({ type: ErrorResponseDto })` |
| `POST /beneficiaries/{id}/reactivate` | `backend/src/beneficiaries/beneficiaries.controller.ts:82` | tag `beneficiaries` · summary · Bearer · body `BeneficiaryReasonDto` · path id · responses 201 | response schema: `@ApiCreatedResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole)<br>`@ApiNotFoundResponse({ type: ErrorResponseDto })` |
| `POST /beneficiaries/{id}/notes` | `backend/src/beneficiaries/beneficiaries.controller.ts:92` | tag `beneficiaries` · summary · Bearer · body `CreateBeneficiaryNoteDto` · path id · responses 201 | response schema: `@ApiCreatedResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole)<br>`@ApiNotFoundResponse({ type: ErrorResponseDto })` |
| `PATCH /campaigns/{id}/beneficiaries/{beneficiaryId}` | `backend/src/beneficiaries/beneficiaries.controller.ts:104` | tag `beneficiaries` · summary · Bearer · body `UpdateBeneficiaryLinkDto` · path id, beneficiaryId · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole)<br>`@ApiNotFoundResponse({ type: ErrorResponseDto })` |

### payment-methods

| Endpoint | Handler | Documented | Missing → add |
|---|---|---|---|
| `GET /payment-methods` | `backend/src/payment-methods/payment-methods.controller.ts:31` | tag `payment-methods` · summary · public · query lang · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe) |
| `GET /campaigns/{id}/payment-accounts` | `backend/src/payment-methods/payment-methods.controller.ts:37` | tag `payment-methods` · summary · public · path id · query lang · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiNotFoundResponse({ type: ErrorResponseDto })` |
| `GET /payment-methods/config` | `backend/src/payment-methods/payment-methods.controller.ts:52` | tag `payment-methods` · summary · Bearer · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole) |
| `PATCH /payment-methods/config/{method}` | `backend/src/payment-methods/payment-methods.controller.ts:58` | tag `payment-methods` · summary · Bearer · body `UpdatePaymentMethodConfigDto` · path method · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole)<br>`@ApiNotFoundResponse({ type: ErrorResponseDto })` |
| `GET /campaigns/{id}/payment-accounts/overrides` | `backend/src/payment-methods/payment-methods.controller.ts:78` | tag `payment-methods` · summary · Bearer · path id · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole)<br>`@ApiNotFoundResponse({ type: ErrorResponseDto })` |
| `PUT /campaigns/{id}/payment-accounts/{method}` | `backend/src/payment-methods/payment-methods.controller.ts:84` | tag `payment-methods` · summary · Bearer · body `SetCampaignAccountDto` · path id, method · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole)<br>`@ApiNotFoundResponse({ type: ErrorResponseDto })` |
| `DELETE /campaigns/{id}/payment-accounts/{method}` | `backend/src/payment-methods/payment-methods.controller.ts:96` | tag `payment-methods` · summary · Bearer · path id, method · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole)<br>`@ApiNotFoundResponse({ type: ErrorResponseDto })` |

### cases

| Endpoint | Handler | Documented | Missing → add |
|---|---|---|---|
| `GET /cases/track` | `backend/src/cases/cases.controller.ts:35` | tag `cases` · summary · public · query no, phoneLast4 · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe) |
| `POST /cases` | `backend/src/cases/cases.controller.ts:50` | tag `cases` · summary · Bearer · body `CreateCaseDto` (multipart) · responses 201 | response schema: `@ApiCreatedResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole) |
| `GET /cases` | `backend/src/cases/cases.controller.ts:65` | tag `cases` · summary · Bearer · query status, priority, overdue · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole) |
| `GET /cases/{id}` | `backend/src/cases/cases.controller.ts:71` | tag `cases` · summary · Bearer · path id · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole)<br>`@ApiNotFoundResponse({ type: ErrorResponseDto })` |
| `POST /cases/{id}/review` | `backend/src/cases/cases.controller.ts:77` | tag `cases` · summary · Bearer · body `ReviewCaseDto` · path id · responses 201 | response schema: `@ApiCreatedResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole)<br>`@ApiNotFoundResponse({ type: ErrorResponseDto })` |
| `PATCH /cases/{id}/hospital-amount` | `backend/src/cases/cases.controller.ts:87` | tag `cases` · summary · Bearer · body `ChangeHospitalAmountDto` · path id · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole)<br>`@ApiNotFoundResponse({ type: ErrorResponseDto })` |
| `POST /cases/{id}/publish` | `backend/src/cases/cases.controller.ts:99` | tag `cases` · summary · Bearer · body `PublishCaseDto` · path id · responses 201 | response schema: `@ApiCreatedResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole)<br>`@ApiNotFoundResponse({ type: ErrorResponseDto })` |
| `GET /documents/{id}/file` | `backend/src/cases/cases.controller.ts:109` | tag `cases` · summary · Bearer · path id · responses 200 | file response: `@ApiProduces('application/octet-stream')` (or text/csv) + `@ApiOkResponse({ description: 'file' })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole)<br>`@ApiNotFoundResponse({ type: ErrorResponseDto })` |

### pledges

| Endpoint | Handler | Documented | Missing → add |
|---|---|---|---|
| `GET /campaigns/{id}/allocation` | `backend/src/pledges/pledges.controller.ts:42` | tag `pledges` · summary · public · path id · query amount, lang · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiNotFoundResponse({ type: ErrorResponseDto })` |
| `GET /official-receipts/{no}` | `backend/src/pledges/pledges.controller.ts:54` | tag `pledges` · summary · public · path no · query lang · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiNotFoundResponse({ type: ErrorResponseDto })` |
| `POST /pledges` | `backend/src/pledges/pledges.controller.ts:69` | tag `pledges` · summary · Bearer · body `CreatePledgeDto` · responses 201 | response schema: `@ApiCreatedResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole) |
| `POST /pledges/demo` | `backend/src/pledges/pledges.controller.ts:75` | tag `pledges` · summary · Bearer · body `DemoPledgeDto` · responses 201 | response schema: `@ApiCreatedResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole) |
| `POST /pledges/cash` | `backend/src/pledges/pledges.controller.ts:81` | tag `pledges` · summary · Bearer · body `CashPledgeDto` · responses 201 | response schema: `@ApiCreatedResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole) |
| `POST /pledges/council` | `backend/src/pledges/pledges.controller.ts:89` | tag `pledges` · summary · Bearer · body `CouncilPledgeDto` · responses 201 | response schema: `@ApiCreatedResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole) |
| `POST /pledges/collector` | `backend/src/pledges/pledges.controller.ts:95` | tag `pledges` · summary · Bearer · body `CollectorPledgeDto` · responses 201 | response schema: `@ApiCreatedResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole) |
| `GET /pledges/mine` | `backend/src/pledges/pledges.controller.ts:101` | tag `pledges` · summary · Bearer · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole) |
| `GET /pledges/recorded` | `backend/src/pledges/pledges.controller.ts:107` | tag `pledges` · summary · Bearer · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole) |
| `GET /pledges/{id}` | `backend/src/pledges/pledges.controller.ts:113` | tag `pledges` · summary · Bearer · path id · query lang · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole)<br>`@ApiNotFoundResponse({ type: ErrorResponseDto })` |
| `POST /pledges/{id}/receipts` | `backend/src/pledges/pledges.controller.ts:123` | tag `pledges` · summary · Bearer · body `UploadReceiptDto` (multipart) · path id · responses 201 | response schema: `@ApiCreatedResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole)<br>`@ApiNotFoundResponse({ type: ErrorResponseDto })` |
| `POST /pledges/{id}/cancel` | `backend/src/pledges/pledges.controller.ts:137` | tag `pledges` · summary · Bearer · path id · responses 201 | response schema: `@ApiCreatedResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole)<br>`@ApiNotFoundResponse({ type: ErrorResponseDto })` |
| `POST /pledges/{id}/allocation-decision` | `backend/src/pledges/pledges.controller.ts:143` | tag `pledges` · summary · Bearer · body `AllocationDecisionDto` · path id · responses 201 | response schema: `@ApiCreatedResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole)<br>`@ApiNotFoundResponse({ type: ErrorResponseDto })` |
| `GET /receipts/{id}/file` | `backend/src/pledges/pledges.controller.ts:156` | tag `pledges` · summary · Bearer · path id · responses 200 | file response: `@ApiProduces('application/octet-stream')` (or text/csv) + `@ApiOkResponse({ description: 'file' })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole)<br>`@ApiNotFoundResponse({ type: ErrorResponseDto })` |

### collector

| Endpoint | Handler | Documented | Missing → add |
|---|---|---|---|
| `GET /collector/points` | `backend/src/collector/collector.controller.ts:19` | tag `collector` · summary · Bearer · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole) |
| `GET /collector/pledges` | `backend/src/collector/collector.controller.ts:25` | tag `collector` · summary · Bearer · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole) |
| `GET /collector/pledges/by-reference/{referenceNo}` | `backend/src/collector/collector.controller.ts:31` | tag `collector` · summary · Bearer · path referenceNo · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole)<br>`@ApiNotFoundResponse({ type: ErrorResponseDto })` |
| `POST /collector/pledges/{id}/confirm` | `backend/src/collector/collector.controller.ts:39` | tag `collector` · summary · Bearer · path id · responses 201 | response schema: `@ApiCreatedResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole)<br>`@ApiNotFoundResponse({ type: ErrorResponseDto })` |
| `GET /collector/history` | `backend/src/collector/collector.controller.ts:47` | tag `collector` · summary · Bearer · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole) |

### verifications

| Endpoint | Handler | Documented | Missing → add |
|---|---|---|---|
| `GET /verifications` | `backend/src/verifications/verifications.controller.ts:25` | tag `verifications` · summary · Bearer · query status · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole) |
| `POST /verifications/{id}/approve` | `backend/src/verifications/verifications.controller.ts:31` | tag `verifications` · summary · Bearer · path id · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole)<br>`@ApiNotFoundResponse({ type: ErrorResponseDto })` |
| `POST /verifications/{id}/reject` | `backend/src/verifications/verifications.controller.ts:40` | tag `verifications` · summary · Bearer · body `RejectVerificationDto` · path id · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole)<br>`@ApiNotFoundResponse({ type: ErrorResponseDto })` |

### expenditures

| Endpoint | Handler | Documented | Missing → add |
|---|---|---|---|
| `GET /campaigns/{id}/spending` | `backend/src/expenditures/expenditures.controller.ts:29` | tag `expenditures` · summary · public · path id · query lang · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiNotFoundResponse({ type: ErrorResponseDto })` |
| `GET /expenditures/{id}/proof` | `backend/src/expenditures/expenditures.controller.ts:35` | tag `expenditures` · summary · public · path id · responses 200 | file response: `@ApiProduces('application/octet-stream')` (or text/csv) + `@ApiOkResponse({ description: 'file' })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiNotFoundResponse({ type: ErrorResponseDto })` |
| `POST /expenditures` | `backend/src/expenditures/expenditures.controller.ts:51` | tag `expenditures` · summary · Bearer · body `CreateExpenditureDto` (multipart) · responses 201 | response schema: `@ApiCreatedResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole) |
| `POST /campaigns/{id}/expenditures/monthly` | `backend/src/expenditures/expenditures.controller.ts:66` | tag `expenditures` · summary · Bearer · body `MonthlyRunDto` (multipart) · path id · responses 201 | response schema: `@ApiCreatedResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole)<br>`@ApiNotFoundResponse({ type: ErrorResponseDto })` |
| `GET /campaigns/{id}/spending-context` | `backend/src/expenditures/expenditures.controller.ts:82` | tag `expenditures` · summary · Bearer · path id · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole)<br>`@ApiNotFoundResponse({ type: ErrorResponseDto })` |
| `GET /campaigns/{id}/expenditures` | `backend/src/expenditures/expenditures.controller.ts:90` | tag `expenditures` · summary · Bearer · path id · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole)<br>`@ApiNotFoundResponse({ type: ErrorResponseDto })` |

### stats

| Endpoint | Handler | Documented | Missing → add |
|---|---|---|---|
| `GET /stats/transparency` | `backend/src/stats/stats.controller.ts:13` | tag `stats` · public · query lang · responses 200 | `@ApiOperation({ summary: '…' })`<br>response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe) |
| `GET /stats/transparency.csv` | `backend/src/stats/stats.controller.ts:22` | tag `stats` · public · query lang · responses 200 | `@ApiOperation({ summary: '…' })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe) |

### collection-points

| Endpoint | Handler | Documented | Missing → add |
|---|---|---|---|
| `GET /collection-points/active` | `backend/src/hospitals/lookups.controller.ts:28` | tag `collection-points` · summary · public · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })` |

### lookups

| Endpoint | Handler | Documented | Missing → add |
|---|---|---|---|
| `GET /hospitals` | `backend/src/hospitals/lookups.controller.ts:43` | tag `lookups` · summary · Bearer · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole) |
| `POST /hospitals` | `backend/src/hospitals/lookups.controller.ts:55` | tag `lookups` · summary · Bearer · body `CreateHospitalDto` · responses 201 | response schema: `@ApiCreatedResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole) |
| `GET /hospitals/all` | `backend/src/hospitals/lookups.controller.ts:49` | tag `lookups` · summary · Bearer · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole) |
| `PATCH /hospitals/{id}` | `backend/src/hospitals/lookups.controller.ts:61` | tag `lookups` · summary · Bearer · body `UpdateHospitalDto` · path id · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole)<br>`@ApiNotFoundResponse({ type: ErrorResponseDto })` |
| `GET /collection-points` | `backend/src/hospitals/lookups.controller.ts:71` | tag `lookups` · summary · Bearer · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole) |
| `POST /collection-points` | `backend/src/hospitals/lookups.controller.ts:83` | tag `lookups` · summary · Bearer · body `CreateCollectionPointDto` · responses 201 | response schema: `@ApiCreatedResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole) |
| `GET /collection-points/mine` | `backend/src/hospitals/lookups.controller.ts:77` | tag `lookups` · summary · Bearer · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole) |
| `PATCH /collection-points/{id}` | `backend/src/hospitals/lookups.controller.ts:92` | tag `lookups` · summary · Bearer · body `UpdateCollectionPointDto` · path id · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole)<br>`@ApiNotFoundResponse({ type: ErrorResponseDto })` |

### users

| Endpoint | Handler | Documented | Missing → add |
|---|---|---|---|
| `GET /users` | `backend/src/users/users.controller.ts:26` | tag `users` · summary · Bearer · query role · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole) |
| `POST /users` | `backend/src/users/users.controller.ts:32` | tag `users` · summary · Bearer · body `CreateUserDto` · responses 201 | response schema: `@ApiCreatedResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole) |
| `PATCH /users/{id}` | `backend/src/users/users.controller.ts:38` | tag `users` · summary · Bearer · body `UpdateUserDto` · path id · responses 200 | response schema: `@ApiOkResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole)<br>`@ApiNotFoundResponse({ type: ErrorResponseDto })` |

### imports

| Endpoint | Handler | Documented | Missing → add |
|---|---|---|---|
| `POST /imports/preview` | `backend/src/imports/imports.controller.ts:72` | tag `imports` · summary · Bearer · body `ImportFileDto` (multipart) · responses 201 | response schema: `@ApiCreatedResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole) |
| `POST /imports/{id}/validate` | `backend/src/imports/imports.controller.ts:84` | tag `imports` · summary · Bearer · body `MappingDto` · path id · responses 201 | response schema: `@ApiCreatedResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole)<br>`@ApiNotFoundResponse({ type: ErrorResponseDto })` |
| `POST /imports/{id}/commit` | `backend/src/imports/imports.controller.ts:94` | tag `imports` · summary · Bearer · path id · responses 201 | response schema: `@ApiCreatedResponse({ type: <Response>Dto })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole)<br>`@ApiNotFoundResponse({ type: ErrorResponseDto })` |
| `GET /imports/{id}/errors.csv` | `backend/src/imports/imports.controller.ts:100` | tag `imports` · summary · Bearer · path id · responses 200 | file response: `@ApiProduces('application/octet-stream')` (or text/csv) + `@ApiOkResponse({ description: 'file' })`<br>`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)<br>`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)<br>`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole)<br>`@ApiNotFoundResponse({ type: ErrorResponseDto })` |

## DTO properties without an example

Not an error, but `@ApiProperty({ example })` makes "Try it out" and the generated Postman bodies usable without editing.

| DTO (schema) | Properties without `example` |
|---|---|
| `RegisterDto` | password |
| `MeResponse` | id, fullName, phone |
| `AuthResponseDto` | accessToken |
| `LoginDto` | password |
| `CreateCategoryDto` | descriptionAr, descriptionEn, sortOrder |
| `UpdateCategoryDto` | nameAr, nameEn, descriptionAr, descriptionEn, sortOrder |
| `CreateCampaignDto` | categoryId, titleEn, summaryAr, summaryEn |
| `UpdateCampaignDto` | titleAr, titleEn, summaryAr, summaryEn, area |
| `CreateCampaignUpdateDto` | bodyEn |
| `UpdateBeneficiaryDto` | fullName, phone, area |
| `LinkBeneficiaryDto` | beneficiaryId |
| `UpdatePaymentMethodConfigDto` | accountName, accountNameEn, instructionsAr, instructionsEn, sortOrder |
| `CreateCaseDto` | description |
| `ReviewCaseDto` | hospitalId, reason |
| `ChangeHospitalAmountDto` | hospitalId |
| `PublishCaseDto` | titleEn, redactedSummary, summaryEn |
| `CreatePledgeDto` | campaignId |
| `DemoPledgeDto` | campaignId |
| `CashPledgeDto` | campaignId, collectionPointId |
| `CouncilPledgeDto` | campaignId |
| `CollectorPledgeDto` | campaignId, collectionPointId, donorName, donorPhone |
| `CreateExpenditureDto` | campaignId, beneficiaryId |
| `UpdateHospitalDto` | nameAr, nameEn, city |
| `CreateCollectionPointDto` | contactName |
| `UpdateCollectionPointDto` | name, contactName, area |
| `CreateUserDto` | fullName, password, collectionPointIds |
| `UpdateUserDto` | fullName, collectionPointIds |
