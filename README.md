# @yc/scrapers

TypeScript service that writes **JSON under `data/federal/`, `data/provincial/`, and `data/municipal/`**, exposes **`GET /health`**, **`GET /all`**, **`GET /diff`**, **`GET /federal/:slug`**, **`GET /provincial/:slug`**, **`GET /municipal/:slug`**, and **`GET /municipal/:slug/diff`** (same auth as `@yc/mq` when `API_TUNNEL_SECRET` is set), and provides **CLI commands** to run scrapers (use your platform scheduler—e.g. Dokploy—to run `scrape:all` on a cadence).

After each **successful** scrape, the service fetches the live YouCount snapshot (`currentUrl`), compares it to the scraped reps (same logic as admin-amplify rep sync), and stores **`currentSource`**, **`diff`**, and **`diffError`** on the same run JSON. **`GET /diff`** returns those embedded diffs for every registered scraper in one response (no per-slug diff routes).

Each scraper has a short **`slug`** (e.g. `senator`, `bc`) and a **`gov_level`** (`federal` or `provincial`, matching the `data/` subdirectory). Register them in `src/constants.ts` and `src/registry.ts` (registry key === slug).

## Storage layout

Under `DATA_DIR` (default `./data` next to the process cwd, or `/data` in Docker):

- `federal/<slug>.json` — e.g. `federal/senator.json`
- `provincial/<slug>.json` — e.g. `provincial/bc.json`

Each write replaces that file. On success the JSON includes `data` (reps array), optional **`diff`** (`added` / `deleted` as rep arrays, **`changed`** as `{ name, first_name, last_name, updated: string[] }`), **`currentSource`**, and **`diffError`** when the YouCount comparison could not run. On error, `status` is `error` and `error` has the message. Persisted records use `gov_level`, `slug`, and `id` in the form `<gov_level>/<slug>`. Older files may still contain `tier`; reads map that to `gov_level`.

The `data/` directory is **gitignored** (see repo `.gitignore`).

## Requirements

- Node 22+

## Environment

- `DATA_DIR` — JSON storage root. Defaults to `./data` under cwd locally; **Docker image defaults to `/data`** (must match your volume mount).
- `PORT` — HTTP port (default `3101`).
- `SCRAPE_ON_STARTUP` — when `true`, runs `scrape:all` in the background after HTTP starts (repopulates a fresh volume).
- `API_TUNNEL_SECRET` — optional; when set, protects `/all`, `/diff`, `/federal/*`, `/provincial/*`, and `/municipal/*` (not `/health`) like `@yc/mq`.

## Docker / Dokploy (persistent data)

Scrape results are **files on disk**, not in the image. If the API is empty after redeploy, the container is almost always reading/writing the **wrong path** or **no persistent volume**.

**Required for production:**

1. Mount a **persistent volume** at **`/data`** on the long-running service.
2. Set **`DATA_DIR=/data`** (default in the Docker image; do not omit in Dokploy).
3. Run **`node dist/runAll.js`** on a schedule (or set **`SCRAPE_ON_STARTUP=true`** once after first deploy).
4. Any scrape cron/job must use the **same** `/data` volume as the HTTP service.

On startup the service logs: `DATA_DIR=/data (N run files on disk)`. If `N` is 0 after redeploy, the volume is not attached or points at an empty directory.

## Docker Compose

From `apps/scrapers`:

```bash
docker compose up --build
```

- **scrapers**: HTTP on **`3101`**, JSON on named volume **`scrapers_data` → `/data`** (`DATA_DIR=/data`). Use bind mount `./data:/data` instead if you prefer a local folder.
- **Scheduled full refresh:** run **`node dist/runAll.js`** (same image, same `DATA_DIR`) from Dokploy or `docker compose run --rm scrapers node dist/runAll.js` so enabled scrapers run **one after another**; the long-running service only serves HTTP.

### HTTP API

- `GET /health` — no auth
- When `API_TUNNEL_SECRET` is set, use `Authorization: Bearer <secret>` or `x-cloudflare-worker-secret: <secret>` (same as mq) for the routes below.
- `GET /all` — list `{ gov_level, slug, enabled }` for each registered scraper (JSON body still uses the `scrapers` array key)
- `GET /diff` — `{ generatedAt, scrapers }` where each row has `gov_level`, `slug`, `status` (`success` | `error` | `missing`), `finishedAt`, `currentSource`, and the embedded `diff` / `diffError` from disk (same fields as on each run file when present)
- `GET /federal/:slug` — stored run JSON as `{ run }` (`404` if unknown slug or no file yet)
- `GET /provincial/:slug` — same for provincial scrapers
- `GET /municipal/:slug` — stored scrape run JSON as `{ run }` (`404` if unknown slug or no file yet)
- `GET /municipal/:slug/diff` — per-council diff vs YouCount (`added` / `deleted` / `changed` with matching `counts`; not the national `combined` aggregate)

Example:

```bash
curl -s http://127.0.0.1:3101/health
curl -s http://127.0.0.1:3101/all
curl -s http://127.0.0.1:3101/diff
curl -s http://127.0.0.1:3101/federal/senator
curl -s http://127.0.0.1:3101/provincial/bc
curl -s http://127.0.0.1:3101/municipal/calgary-city-council
curl -s http://127.0.0.1:3101/municipal/kelowna-city-council/diff
```

## Monorepo scripts

From repo root:

```bash
pnpm install
pnpm --filter @yc/scrapers dev
pnpm --filter @yc/scrapers scrape senator
pnpm --filter @yc/scrapers scrape bc
pnpm --filter @yc/scrapers scrape:all
pnpm --filter @yc/scrapers build
pnpm --filter @yc/scrapers start
```

After `build`, production one-off / scheduled runs: **`node dist/runAll.js`** (all scrapers) or **`node dist/runOnce.js <slug>`** (single scraper); set `DATA_DIR` / `cwd` the same as the HTTP container if they share JSON on disk.

## Verify a run

```bash
ls -la apps/scrapers/data/federal/
ls -la apps/scrapers/data/provincial/
```
