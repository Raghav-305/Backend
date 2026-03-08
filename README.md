# Neon-Flux Backend — README

This folder contains a minimal Express-based backend used by the Neon-Flux frontend.
It is intentionally small and file-backed for local development. You can replace
storage and email with managed services for production.

Key features
- Read-only content endpoints that serve data from `backend/data/*.json` (projects, clients, services).
- Contact form handler that attempts SendGrid → SMTP → local file fallback.
- Simple admin file upload endpoint (token protected) that stores files under `backend/uploads` and serves them via `/uploads`.
- Basic security: `helmet`, `express-rate-limit`, CORS configuration, input validation.

Contents
- `src/index.js` — main Express server and route handlers.
- `data/` — example JSON data files: `projects.json`, `clients.json`, `services.json`, `contacts.json`.
- `uploads/` — runtime directory for uploaded files (created automatically).
- `.env.example` — environment variables you must set in `.env`.
- `package.json` — dependencies and start scripts.

Endpoints
- `GET /api/health` — returns { ok: true, time } to verify server is up.
- `GET /api/projects` — returns normalized list of projects (reads `data/projects.json`). Normalization fills missing fields and resolves client names when `clientId` is present.
- `GET /api/projects/:slug` — returns single project by slug (404 if missing).
- `GET /api/clients` — returns normalized clients (reads `data/clients.json`).
- `GET /api/services` — returns normalized services (reads `data/services.json`).
- `GET /api/services` — returns normalized services (reads `data/services.json`).
- `GET /api/portfolio` — returns combined normalized `projects` and `services` (reads `data/projects.json` and `data/services.json`).
- `POST /api/contact` — accepts JSON payload: { name, email, message, phone?, city?, eventType?, budget?, subject? }.
	- Validates `name`, `email`, `message` server-side.
	- Tries to send email with SendGrid if `SENDGRID_API_KEY` and `SENDGRID_FROM` are set.
	- If SendGrid fails or is not configured, attempts SMTP if `SMTP_HOST` + `SMTP_USER` present.
	- If no mail provider works, appends contact to `data/contacts.json` as fallback.
	- Responds with JSON `{ ok: true, method: 'sendgrid'|'smtp'|'file' }` on success.
- `POST /api/admin/upload` — multipart form upload, header `x-admin-token: <ADMIN_TOKEN>` or query `?token=` required.
	- Stores file under `uploads/` and returns `{ ok: true, url }` where `url` is served from `/uploads/<filename>`.

How content normalization works
- Projects: `normalizeProject` fills `id`, `title`, `slug`, `categories`, `client` (resolved via `clientId`), `date` (ISO), `stats` array and `location`.
- Clients & services: each record gets an `id` and default fields when missing.

Environment variables
Create `backend/.env` (copy `.env.example`) and set these at minimum for development:
- `PORT` (default 4000)
- `CORS_ORIGIN` — origin permitted by CORS (e.g. `http://localhost:8080`).
- For email (optional): `SENDGRID_API_KEY`, `SENDGRID_FROM`, `SENDGRID_TO`.
- SMTP fallback (optional): `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_TO`.
- `ADMIN_TOKEN` — simple shared secret protecting `/api/admin/upload`.

Run locally
1. Copy env example and edit values:
```powershell
cd backend
cp .env.example .env
# edit .env as needed
```
2. Install and start (dev):
```powershell
npm install
npm run dev
# or in production
npm start
```
3. Verify endpoints:
```powershell
curl http://localhost:4000/api/health
curl http://localhost:4000/api/clients
curl http://localhost:4000/api/projects
```

Frontend integration
- Development with Vite: the frontend in this repo uses a Vite proxy so frontend code can call relative `/api/*` paths. See `vite.config.ts` for the proxy config (`/api` → `http://localhost:4000`).
- Alternatively set `VITE_API_BASE` in the frontend `.env` and have frontend requests use that base URL.

Security notes
- The admin upload endpoint uses a basic shared token (`ADMIN_TOKEN`) — replace with proper auth for production.
- Use HTTPS in production and strong secrets for `ADMIN_TOKEN`, SMTP and SendGrid keys.
- The contact endpoint has rate limiting enabled (20 requests/minute per IP) and input validation.

Extending for production
- Replace local JSON storage with a real database (Postgres / Supabase). Move normalization logic to queries or ORM models.
- Replace local uploads with S3/Cloudinary and return those URLs from the upload handler.
- Use a transactional email provider (SendGrid is supported in code) and monitor sending errors.
- Add authentication for admin routes and a small admin UI or use a headless CMS.

Troubleshooting
- Unexpected HTML when calling `/api/*`: frontend is calling the wrong origin or Vite proxy is not configured. Ensure backend runs on `localhost:4000` and Vite dev server is forwarding `/api`.
- `npm install` errors for `@sendgrid/mail` version: ensure `package.json` has a valid SendGrid version (7.x or 8.x depending on registry). If install fails, run `rm -rf node_modules package-lock.json` then `npm install`.
- Check logs: the server prints errors to console; examine `backend/data/contacts.json` to confirm fallback writes.

Contact & next steps
If you want, I can:
- Patch frontend components to use the API consistently (contact form already wired in this repo).
- Switch the upload handler to Cloudinary/S3 and update README with deployment steps.
- Add basic admin auth (JWT) and example scripts to migrate `data/*.json` into Postgres/Supabase.
