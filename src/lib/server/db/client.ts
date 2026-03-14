import type { D1Database } from '@cloudflare/workers-types';
import { drizzle } from 'drizzle-orm/d1';

import * as schema from './schema';

export interface ApiBindings {
  DB: D1Database;
}

export function getDb(bindings: Partial<ApiBindings>) {
  const database = bindings.DB;

  if (!database) {
    return null;
  }

  return drizzle(database, { schema });
}
