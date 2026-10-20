import { runMigrations } from "./lib/migrate";

// Runs once at server start (Node runtime only).
if (process.env.SKIP_MIGRATIONS !== "true") {
  try {
    await runMigrations();
  } catch (err) {
    console.error("[migrate] failed", err);
    // Refuse to serve against an unknown schema; Docker restarts the container.
    process.exit(1);
  }
}
