import postgres from "postgres";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

type Db = PostgresJsDatabase<typeof schema>;

// Created on first use so `next build` never needs a database.
const globalForDb = globalThis as unknown as { __aedSql?: postgres.Sql; __aedDb?: Db };

export function sqlClient(): postgres.Sql {
  if (!globalForDb.__aedSql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    globalForDb.__aedSql = postgres(url, { max: 10, onnotice: () => {} });
  }
  return globalForDb.__aedSql;
}

export function db(): Db {
  if (!globalForDb.__aedDb) {
    globalForDb.__aedDb = drizzle(sqlClient(), { schema });
  }
  return globalForDb.__aedDb;
}
