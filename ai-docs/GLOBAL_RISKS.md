# Global Risks — Consolidated

Security risks
- JWT in `localStorage` (web) — XSS exposure. Reference: [smartcampost-frontend/src/store/authStore.ts](smartcampost-frontend/src/store/authStore.ts#L1-L30)
- SSE token in URL — can leak to history/proxies. Reference: [smartcampost-frontend/src/hooks/useAiSSE.tsx](smartcampost-frontend/src/hooks/useAiSSE.tsx#L31-L34)
- Mobile uses secure storage (good) but lacks refresh token flow.

Operational risks
- Frontend type-check failing due to i18n JSON errors (`fr.json`) and missing `@types/*` — blocks CI. Reference: [smartcampost-frontend/src/i18n/locales/fr.json](smartcampost-frontend/src/i18n/locales/fr.json)
- Inconsistent token handling across clients (web vs mobile) requires harmonization (refresh, expiry handling).
- ApprovalProcessor running in scheduled mode must be safe in multi-instance deployments (risk of duplicate processing) — needs distributed lock or single-worker design.

AI risks
- AI-generated assignment or payments are high-impact — must be gated by approval workflows and audit logs. Ensure `AiDecisionLog` and `AiExecutionLog` are immutable and auditable.

Compliance & privacy
- Ensure secure handling of user PII stored in both frontend and mobile caches. Secure storage is used on mobile; web stores user info in `localStorage` partial state (consider minimization).
