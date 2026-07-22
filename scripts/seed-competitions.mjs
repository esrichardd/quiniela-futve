import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

import { neon } from "@neondatabase/serverless";

for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) loadEnvFile(file);
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const sql = neon(process.env.DATABASE_URL);

await sql`
  insert into competitions (id, code, name, is_active)
  values ('00000000-0000-4000-8000-000000000001', 'futve', 'Liga FUTVE', true)
  on conflict (code) do update
  set name = excluded.name,
      is_active = true,
      updated_at = now()
`;

console.log("Competition seed completed.");
