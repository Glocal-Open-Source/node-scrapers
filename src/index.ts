import "dotenv/config";
import { getServer, startServer } from "./server";

function bootstrap(): void {
  startServer();
}

bootstrap();

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
