# Frontend Missing Features & Action Items

Immediate fixes blocking type-check and CI
- Fix JSON syntax in `src/i18n/locales/fr.json` (parse error at file end). See file and correct trailing commas / unmatched braces.
- Add missing TS type definitions reported by `npm run type-check` (install `@types/*` packages or update `tsconfig.json` `types` array).

Security & reliability improvements (recommended)
- Replace `localStorage` JWT persistence with HTTP-only cookies + refresh token flow.
- Implement short-lived SSE tokens or a server-issued one-time SSE token exchange endpoint to avoid token-in-URL leakage.
- Add client-side idempotency keys for critical write flows (parcel creation, assignment) and include header `Idempotency-Key` on API calls.

Developer ergonomics
- Add comprehensive `src/types/api.d.ts` or generator (OpenAPI → TypeScript) to keep client DTOs in sync with backend.
- Add linting & pre-commit hooks to enforce i18n JSON validity and TypeScript checks.

References & quick fixes
- Fix JSON syntax in: [smartcampost-frontend/src/i18n/locales/fr.json](smartcampost-frontend/src/i18n/locales/fr.json)
- Run TypeScript check locally:

```bash
cd smartcampost-frontend
npm run type-check
```

- Axios + SSE token behavior: [smartcampost-frontend/src/lib/axiosClient.ts](smartcampost-frontend/src/lib/axiosClient.ts#L1-L30) and [smartcampost-frontend/src/hooks/useAiSSE.tsx](smartcampost-frontend/src/hooks/useAiSSE.tsx#L31-L34)


Observability & monitoring
- Surface SSE reconnection status in the UI (toasts or banner) when EventSource disconnects.
- Centralize error reporting to a monitoring service for frontend exceptions.

AI & Approval UX
- Approvals UI should list `toolName`, `parameters` and include a preview of the action before approving (the backend already stores `parametersJson`).
- Add real-time notifications (toasts/push) for newly enqueued approvals using existing SSE channel.
