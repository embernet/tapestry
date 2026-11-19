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
docker compose up -d --build
scripts/user.sh add <username> "Display Name"   # create a local account (prompts for a password)
```

- `GET /healthz` is open; everything else needs a signed-in user.
- Models, settings and AI keys stay in the browser (`localStorage`); the server
  keeps only accounts and sessions.
- Optional back link: set both `PORTAL_URL` and `PORTAL_NAME`.
- Do not set `API_KEY`/`GEMINI_API_KEY` when building an image for other
  people: Vite bakes it into the page.
- Tests: `npm test` (Node 24).
- Deploy a release into a separate checkout: `scripts/promote.sh --ref <tag>`.
