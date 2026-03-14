import type { APIRoute } from 'astro';

import { app } from '../../lib/server/api';
import type { ApiBindings } from '../../lib/server/db/client';

type RuntimeLocals = {
  runtime?: {
    env?: Partial<ApiBindings>;
  };
};

export const ALL: APIRoute = ({ request, locals }) => {
  const runtime = (locals as RuntimeLocals).runtime;
  const bindings = (runtime?.env ?? {}) as ApiBindings;

  return app.fetch(request, bindings);
};
