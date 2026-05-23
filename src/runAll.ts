import "dotenv/config";
import { runAll } from "./runner";

void runAll()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
