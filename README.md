# decision-insight-platform-325145-325154

## Preview integration notes (Decision Replay)

This repo contains the **Decision Replay backend** (Express). The Next.js frontend is in a separate container workspace.

### Backend env (Express)
The backend reads Postgres connection details from the platform-provided env vars:

- `POSTGRES_URL` (preferred)
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT` (used to supplement URL or as fallback)

For local development, copy `decision_replay_backend/.env.example` to `.env` and fill values.

### CORS for preview
Set backend:

- `ALLOWED_ORIGINS=<frontend preview origin>`
  - Example: `https://vscode-internal-xxxxx.beta01.cloud.kavia.ai:3000`

The backend has `credentials: true` enabled to support cookie-based auth if added later.

### Frontend env (Next.js)
Set frontend env var (in its container):

- `NEXT_PUBLIC_API_BASE=<backend preview url>`
  - Example: `https://vscode-internal-xxxxx.beta01.cloud.kavia.ai:3001`

The frontend API client automatically sends `Authorization: Bearer <token>` using the token stored in `localStorage` under `dr.auth.token`.
