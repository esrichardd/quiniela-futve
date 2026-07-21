import "server-only";

import { drizzle } from "drizzle-orm/neon-http";

import { env } from "@/lib/env";
import * as schema from "@/server/db/schema";

export const db = drizzle(env.DATABASE_URL, { schema });

export type Database = typeof db;
