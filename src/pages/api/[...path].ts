import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';

import { app } from '../../lib/server/api';
import type { ApiBindings } from '../../lib/server/db/client';

export const ALL: APIRoute = ({ request }) => {
  const bindings = env as Partial<ApiBindings>;
  const url = new URL(request.url);
  const strippedPath = url.pathname.replace(/^\/api(?=\/|$)/, '') || '/';
  url.pathname = strippedPath;
  const proxiedRequest = new Request(url.toString(), request);

  return app.fetch(proxiedRequest, bindings);
};
