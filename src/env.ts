export const env = {
  /** Same semantics as mq: if unset or empty, data routes do not require auth. */
  API_TUNNEL_SECRET: process.env.API_TUNNEL_SECRET ?? "",
  PORT: Number(process.env.PORT ?? "3101"),
} as const;
