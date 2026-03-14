import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';

import { app } from '../../lib/server/api';
import type { ApiBindings } from '../../lib/server/db/client';

export const ALL: APIRoute = ({ request }) => {
  const bindings = env as Partial<ApiBindings>;

  return app.fetch(request, bindings);
};
