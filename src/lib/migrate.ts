import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { sqlClient } from "./db";

// Applies db/migrations/*.sql in name order, once each. An advisory lock keeps
// two app instances from migrating at the same time.
const LOCK_ID = 727_2026;

export async function runMigrations(): Promise<void> {
  const sql = sqlClient();
  const dir = path.join(process.cwd(), "db", "migrations");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();

  await sql.begin(async (tx) => {
    await tx`SELECT pg_advisory_xact_lock(${LOCK_ID})`;
    await tx`CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    const done = new Set((await tx`SELECT name FROM schema_migrations`).map((r) => r.name as string));

    for (const file of files) {
      if (done.has(file)) continue;
      const body = await readFile(path.join(dir, file), "utf8");
      await tx.unsafe(body);
      await tx`INSERT INTO schema_migrations (name) VALUES (${file})`;
      console.log(`[migrate] applied ${file}`);
    }
  });
}
