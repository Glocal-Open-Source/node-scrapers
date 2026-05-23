import "dotenv/config";
import { DEFAULTS } from "./constants";
import { normalizeSlug } from "./slug";
import { runOne } from "./runner";

const raw = process.argv[2];
if (!raw?.trim()) {
  console.error("Usage: pnpm scrape <slug>  (e.g. pnpm scrape senator, pnpm scrape bc)");
  process.exit(1);
}

const slug = normalizeSlug(raw);

async function main(): Promise<void> {
  const target = DEFAULTS[slug];
  if (!target) {
    console.error(`Unknown slug: ${slug}`);
    process.exit(1);
  }
  await runOne(target);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
