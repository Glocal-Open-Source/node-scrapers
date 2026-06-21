import "dotenv/config";
import { env } from "./env";
import { runAll } from "./runner";
import { getServer, startServer } from "./server";
import { countStoredRunFiles, getDataDir } from "./storage/runStore";

async function bootstrap(): Promise<void> {
  startServer();

  const dataDir = getDataDir();
  const runFiles = await countStoredRunFiles();
  console.log(`[scrapers] DATA_DIR=${dataDir} (${runFiles} run files on disk)`);

  if (runFiles === 0) {
    console.warn(
      "[scrapers] No scrape JSON on disk — API will return empty/missing until scrape:all runs.",
    );
    if (dataDir === "/app/data") {
      console.warn(
        "[scrapers] DATA_DIR is /app/data (ephemeral). Mount a volume at /data and set DATA_DIR=/data.",
      );
    }
  }

  if (env.SCRAPE_ON_STARTUP) {
    console.log("[scrapers] SCRAPE_ON_STARTUP — running scrape:all in background");
    void runAll()
      .then(() => console.log("[scrapers] background scrape:all finished"))
      .catch((err) => console.error("[scrapers] background scrape:all failed", err));
  }
}

void bootstrap();

async function shutdown(signal: string): Promise<void> {
  console.log(`[scrapers] ${signal} received — shutting down`);
  const s = getServer();
  if (s) {
    await new Promise<void>((resolve, reject) => {
      s.close((err) => (err ? reject(err) : resolve()));
    }).catch(() => {
      /* ignore close errors */
    });
  }
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
