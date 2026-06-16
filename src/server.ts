import type { Server } from "node:http";
import express from "express";

import { DEFAULTS } from "./constants";
import { env } from "./env";
import type { GovLevel, SyncTarget } from "./interfaces";
import {
  MUNICIPAL_YOUCOUNT_SOURCE,
  readMunicipalAggregateDiff,
  refreshMunicipalAggregateDiff,
} from "./municipal/diff";
import { normalizeSlug } from "./slug";
import { getStoredRun } from "./storage/runStore";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

/** Same rules as @yc/mq `validateApiTunnelAuthExpress`. */
function validateApiTunnelAuthExpress(
  req: express.Request,
  secret: string | undefined,
): boolean {
  if (!secret) return true;

  const authHeader = req.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7) === secret;
  }

  const workerSecret = req.get("x-cloudflare-worker-secret");
  return workerSecret === secret;
}

function authMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): void {
  if (!validateApiTunnelAuthExpress(req, env.API_TUNNEL_SECRET)) {
    res.status(401).json({ success: false, message: "Invalid API key" });
    return;
  }
  next();
}

app.use(authMiddleware);

function targetFor(govLevel: GovLevel, slug: string): SyncTarget | undefined {
  const s = normalizeSlug(slug);
  return Object.values(DEFAULTS).find(
    (t) => t.gov_level === govLevel && t.slug === s,
  );
}

/** All registered scrapers (`gov_level` + `slug` for `GET /federal/...` and `GET /provincial/...`). */
app.get("/all", (_req, res) => {
  res.json({
    scrapers: Object.values(DEFAULTS).map((t) => ({
      gov_level: t.gov_level,
      slug: t.slug,
      enabled: t.enabled !== false,
    })),
  });
});

async function loadRun(
  res: express.Response,
  govLevel: GovLevel,
  rawSlug: string,
): Promise<void> {
  const slug = normalizeSlug(rawSlug);
  const target = targetFor(govLevel, slug);
  if (!target) {
    res.status(404).json({ success: false, message: "Unknown scraper" });
    return;
  }

  const run = await getStoredRun(govLevel, slug);
  if (!run) {
    res.status(404).json({ success: false, message: "No run file yet" });
    return;
  }
  res.json({ run });
}

app.get("/federal/:slug", async (req, res) => {
  try {
    await loadRun(res, "federal", req.params.slug);
  } catch (err) {
    console.error("[scrapers] GET /federal/:slug", err);
    res.status(500).json({ success: false, message: "Failed to load run" });
  }
});

app.get("/provincial/:slug", async (req, res) => {
  try {
    await loadRun(res, "provincial", req.params.slug);
  } catch (err) {
    console.error("[scrapers] GET /provincial/:slug", err);
    res.status(500).json({ success: false, message: "Failed to load run" });
  }
});

/** Aggregates embedded `diff` from each registered scraper’s stored run file. */
app.get("/diff", async (_req, res) => {
  try {
    const generatedAt = new Date().toISOString();
    const targets = Object.values(DEFAULTS);
    const scrapers = await Promise.all(
      targets
        .filter((t) => t.gov_level !== "municipal")
        .map(async (t) => {
          const currentSource = t.currentUrl.trim() || t.opennorthUrl;
          const run = await getStoredRun(t.gov_level, t.slug);
          if (!run) {
            return {
              gov_level: t.gov_level,
              slug: t.slug,
              status: "missing" as const,
              finishedAt: null as string | null,
              currentSource,
              diff: null,
              diffError: null,
            };
          }
          if (run.status === "error") {
            return {
              gov_level: t.gov_level,
              slug: t.slug,
              status: "error" as const,
              finishedAt: run.finishedAt,
              currentSource: run.currentSource ?? currentSource,
              diff: null,
              diffError: run.diffError ?? null,
            };
          }
          return {
            gov_level: t.gov_level,
            slug: t.slug,
            status: "success" as const,
            finishedAt: run.finishedAt,
            currentSource: run.currentSource ?? currentSource,
            diff: run.diff ?? null,
            diffError: run.diffError ?? null,
          };
        }),
    );

    let municipal = await readMunicipalAggregateDiff();
    if (!municipal) {
      try {
        municipal = await refreshMunicipalAggregateDiff();
      } catch (err) {
        console.error("[scrapers] GET /diff municipal aggregate", err);
        const message =
          err instanceof Error ? err.message : "Failed to compute municipal diff";
        municipal = {
          generatedAt: new Date().toISOString(),
          scope: { councils: 0, councilsWithData: 0, councilsQueried: 0 },
          currentSource: MUNICIPAL_YOUCOUNT_SOURCE,
          combined: null,
          councils: [],
          mayors: {
            status: "error",
            scrapeCount: 0,
            youcountCount: 0,
            councilsQueried: 0,
            currentSource: MUNICIPAL_YOUCOUNT_SOURCE,
            diff: null,
            diffError: message,
          },
          councillors: {
            status: "error",
            scrapeCount: 0,
            youcountCount: 0,
            councilsQueried: 0,
            currentSource: MUNICIPAL_YOUCOUNT_SOURCE,
            diff: null,
            diffError: message,
          },
        };
      }
    }

    res.json({ generatedAt, scrapers, municipal });
  } catch (err) {
    console.error("[scrapers] GET /diff", err);
    res.status(500).json({ success: false, message: "Failed to load diffs" });
  }
});

let server: Server | null = null;

export function startServer(): Server {
  server = app.listen(env.PORT, () => {
    console.log(`[scrapers] HTTP server listening on :${env.PORT}`);
  });
  return server;
}

export function getServer(): Server | null {
  return server;
}
