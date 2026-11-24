## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Run with sign-in (Docker)

The Express server in `server/` serves the built app behind a sign-in: local
accounts and/or an OpenID Connect provider (see `server/auth/README.md`).

```bash
cp .env.example .env              # dev defaults: port 8205, data in ./data, local accounts
scripts/compose.sh up -d --build   # docker compose, with the version from git describe
scripts/user.sh add <username> "Display Name"   # create a local account (prompts for a password)
```

- `GET /healthz` (alive) and `GET /readyz` (ready: `database`, built `app`; else 503 with `failing`) are open,
  uncached, and in the suite's shape (horizon-infra standards §12); the Docker healthcheck and
  `promote.sh` use `/readyz`. Everything else needs a signed-in user.
- Models, settings and AI keys stay in the browser (`localStorage`); the server
  keeps only accounts and sessions.
- Optional back link: set both `PORTAL_URL` and `PORTAL_NAME`.
- Do not set `API_KEY`/`GEMINI_API_KEY` when building an image for other
  people: Vite bakes it into the page.
- Tests: `npm test` (Node 24).
- Deploy a release into a separate checkout: `scripts/promote.sh --ref <tag>`.

### Shared AI key (optional)

To give every signed-in user AI without entering a key, put an OpenAI key in a
file on the host (one line, `chmod 600`, readable by `APP_UID`) and set
`SERVER_AI_KEY_FILE` to its path in `.env`. Restart the container to pick up a
new key. The page then offers "Tapestry server" as the AI provider, the
default for anyone without a key of their own. Requests go through
`/api/ai/v1/chat/completions`, where the server adds the key, so the browser
never sees it. Settings: `SERVER_AI_MODEL`, `SERVER_AI_MODELS`,
`SERVER_AI_RPM` (per user per minute), `SERVER_AI_BASE_URL` (any
OpenAI-compatible API). Use per day and per user is in the `ai_usage` table.
