function envFlag(name: string): boolean {
  const v = process.env[name]?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export const env = {
  /** Same semantics as mq: if unset or empty, data routes do not require auth. */
  API_TUNNEL_SECRET: process.env.API_TUNNEL_SECRET ?? "",
  PORT: Number(process.env.PORT ?? "3101"),
  /** When true, run scrape:all in the background after HTTP starts (e.g. fresh volume). */
  SCRAPE_ON_STARTUP: envFlag("SCRAPE_ON_STARTUP"),
} as const;
