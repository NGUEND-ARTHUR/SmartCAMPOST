# Deployment Checklist — SmartCAMPOST

This checklist explains how to run locally, environment variables, and deploy frontend (Vercel) and backend (Render).

Run locally

- Backend (Spring Boot)
  - From repo root: `cd backend`
  - Development run:
    ```powershell
    ./mvnw.cmd spring-boot:run
    ```
  - Or build jar and run:
    ```powershell
    ./mvnw.cmd -DskipTests package
    java -jar target/backend-0.0.1-SNAPSHOT.jar
    ```

- Frontend (Vite)
  - From repo root: `cd smartcampost-frontend`
  - Install deps:
    ```powershell
    npm ci
    ```
  - Dev server (uses `.env.development` by default):
    ```powershell
    npm run dev
    ```
  - Production build (reads `VITE_API_URL` from `.env.production` or Vercel env):
    ```powershell
    npm run build
    ```

Env vars (frontend)
- `VITE_API_URL` — base URL for API (no trailing `/api`). Examples:
  - Development: `http://localhost:8080`
  - Production: `https://<your-render-backend>.onrender.com`

Env vars (backend)
- `CORS_ALLOWED_ORIGINS` — optional; comma-separated list of allowed origins. If not set, code allows common preview patterns and localhost.

Vercel deployment (frontend)
- Project root: set to `smartcampost-frontend` when configuring the Vercel project. Ensure `vercel.json` at that folder contains the SPA rewrite (already added).
- Set Environment Variable in Vercel: `VITE_API_URL` → `https://<your-render-backend>.onrender.com`
- Build command: `npm ci && npm run build`
- Output directory: `dist`

Render deployment (backend)
- Push backend to a Render service (or connect GitHub repo). Ensure build command: `./mvnw.cmd -DskipTests package` and start command `java -jar target/backend-0.0.1-SNAPSHOT.jar`.
- Set `CORS_ALLOWED_ORIGINS` to include your Vercel domain (e.g., `https://<project>.vercel.app`) or leave empty to allow preview patterns.

Notes & gotchas
- Ensure `dist/` is NOT committed if you want Vercel to build from source — otherwise stale built assets may reference wrong env values.
- Vite exposes `import.meta.env.VITE_API_URL` at build time; make sure Vercel env is set before deploy.
- Deep-route rewrites: `smartcampost-frontend/vercel.json` contains a rewrite rule to serve `index.html` for all routes.

Tests
- A small auth exercise script was added at `scripts/test_auth_requests.js` for manual calls to backend endpoints.
- For E2E, add Playwright or Cypress to devDependencies and create tests under `smartcampost-frontend/tests/`.
