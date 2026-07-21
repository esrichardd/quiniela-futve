import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

import { defineConfig } from "drizzle-kit";

for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) {
    loadEnvFile(file);
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

export default defineConfig({
  schema: "./src/server/db/schema/index.ts",
  out: "./src/server/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    table: "__drizzle_migrations",
    schema: "drizzle",
  },
});
