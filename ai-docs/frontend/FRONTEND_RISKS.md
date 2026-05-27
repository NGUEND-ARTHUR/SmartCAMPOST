# Frontend Security & Operational Risks

1) Token storage (XSS risk)
- Current behavior: JWT stored in `localStorage` under key `auth-storage`. This is vulnerable to XSS. Recommendation: migrate to secure HTTP-only refresh token + short-lived access tokens or strong Content Security Policy and XSS mitigations.

2) SSE token leakage
- SSE opens EventSource with `?token=` in URL; tokens can leak in browser history and intermediate proxies. Recommendation: use short-lived token or a session cookie for SSE authentication or implement one-time SSE token endpoint.

3) Client-side role checks
- Role-based UI hides actions but server must enforce authorization. Ensure every write API validates caller role/authority.

4) i18n file parse errors blocking type-check
- `src/i18n/locales/fr.json` contains a JSON syntax error that breaks TypeScript build/validation. Fixing it is required to run `npm run type-check` successfully.

5) Missing type declarations
- TypeScript reported missing type-definition packages (TS2688). Install required `@types/*` packages or add `types` in tsconfig.

6) Dependency & build drift
- Ensure `env` values like `VITE_GOOGLE_CLIENT_ID` are set in the hosting environment; otherwise `GoogleOAuthProvider` will fail silently or produce runtime errors.

7) Offline & retry semantics
- Some write operations lack idempotency keys. If network retries occur, the backend must deduplicate by idempotency token provided by the frontend.

References
- SSE token in URL: [smartcampost-frontend/src/hooks/useAiSSE.tsx](smartcampost-frontend/src/hooks/useAiSSE.tsx#L31-L34)
- Axios interceptor reading `auth-storage`: [smartcampost-frontend/src/lib/axiosClient.ts](smartcampost-frontend/src/lib/axiosClient.ts#L1-L30)
- i18n JSON file (parse error observed during type-check): [smartcampost-frontend/src/i18n/locales/fr.json](smartcampost-frontend/src/i18n/locales/fr.json)

