import { count, desc, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { validator } from 'hono/validator';

import type { ApiBindings } from './db/client';
import { getDb } from './db/client';
import type { NewsRecord } from './db/schema';
import { newsletterSubscriptions, news } from './db/schema';

type AppEnv = {
  Bindings: Partial<ApiBindings>;
};

type SerializedNews = Omit<NewsRecord, 'publishedAt'> & {
  publishedAt: string;
};

const FALLBACK_NEWS: NewsRecord[] = [
  {
    id: 1,
    title: 'Astro 6 ships new server rendering ergonomics',
    sourceUrl: 'https://astro.build/blog/',
    contentSummary:
      'Astro 6 focuses on lower server overhead and cleaner page-level rendering control for hybrid projects.',
    category: 'Astro',
    publishedAt: new Date('2026-03-12T10:00:00Z'),
  },
  {
    id: 2,
    title: 'Cloudflare D1 introduces improved query planner visibility',
    sourceUrl: 'https://developers.cloudflare.com/d1/',
    contentSummary:
      'Developers can now inspect query execution patterns and optimize SQL hotspots faster in production workloads.',
    category: 'Cloudflare',
    publishedAt: new Date('2026-03-11T09:15:00Z'),
  },
  {
    id: 3,
    title: 'Hono gains richer RPC typing for route contracts',
    sourceUrl: 'https://hono.dev/',
    contentSummary:
      'The updated client helpers make endpoint query and response contracts easier to maintain across frontend and edge API code.',
    category: 'Hono',
    publishedAt: new Date('2026-03-10T18:30:00Z'),
  },
  {
    id: 4,
    title: 'Tailwind CSS v4 optimization tips for content-heavy sites',
    sourceUrl: 'https://tailwindcss.com/blog',
    contentSummary:
      'A practical guide to reducing generated CSS and improving style recalculation time on media-rich pages.',
    category: 'CSS',
    publishedAt: new Date('2026-03-10T08:20:00Z'),
  },
  {
    id: 5,
    title: 'Edge observability checklist for modern web apps',
    sourceUrl: 'https://blog.cloudflare.com/',
    contentSummary:
      'A baseline checklist for tracing, metrics, and alerting when deploying multi-route applications to global edge networks.',
    category: 'DevOps',
    publishedAt: new Date('2026-03-09T14:45:00Z'),
  },
  {
    id: 6,
    title: 'MDX authoring patterns for high-performance docs and blogs',
    sourceUrl: 'https://docs.astro.build/en/guides/mdx/',
    contentSummary:
      'How to balance rich component content with static-first rendering for excellent SEO and Lighthouse scores.',
    category: 'MDX',
    publishedAt: new Date('2026-03-08T12:05:00Z'),
  },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parsePositiveInt(value: string | undefined, fallbackValue: number) {
  const parsed = Number.parseInt(value ?? '', 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallbackValue;
  }

  return parsed;
}

function readSingleValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function serializeNewsItems(items: NewsRecord[]): SerializedNews[] {
  return items.map((item) => ({
    ...item,
    publishedAt: item.publishedAt.toISOString(),
  }));
}

function getFallbackNews(page: number, pageSize: number, category: string | null) {
  const filtered = category
    ? FALLBACK_NEWS.filter((item) => item.category.toLowerCase() === category.toLowerCase())
    : FALLBACK_NEWS;
  const sorted = [...filtered].sort((a, b) => b.publishedAt.valueOf() - a.publishedAt.valueOf());
  const offset = (page - 1) * pageSize;
  const paged = sorted.slice(offset, offset + pageSize);

  return {
    data: serializeNewsItems(paged),
    total: sorted.length,
  };
}

const app = new Hono<AppEnv>();

app.get(
  '/news',
  validator('query', (value) => {
    return {
      page: parsePositiveInt(readSingleValue(value.page), 1),
      pageSize: Math.min(parsePositiveInt(readSingleValue(value.pageSize), 10), 50),
      category: readSingleValue(value.category)?.trim() || null,
    };
  }),
  async (c) => {
    const { page, pageSize, category } = c.req.valid('query');
    const offset = (page - 1) * pageSize;

    const db = getDb(c.env);

    if (!db) {
      const fallback = getFallbackNews(page, pageSize, category);
      const totalPages = Math.max(1, Math.ceil(fallback.total / pageSize));

      return c.json({
        data: fallback.data,
        pagination: {
          page,
          pageSize,
          total: fallback.total,
          totalPages,
        },
        filters: {
          category,
        },
      });
    }

    const whereClause = category ? eq(news.category, category) : undefined;

    const [totalResult, rows] = await Promise.all([
      db.select({ value: count() }).from(news).where(whereClause),
      db
        .select()
        .from(news)
        .where(whereClause)
        .orderBy(desc(news.publishedAt))
        .limit(pageSize)
        .offset(offset),
    ]);

    const total = Number(totalResult[0]?.value ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return c.json({
      data: serializeNewsItems(rows),
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
      filters: {
        category,
      },
    });
  }
);

app.post('/newsletter', async (c) => {
  const db = getDb(c.env);

  if (!db) {
    return c.json({ error: 'D1 binding "DB" is not available.' }, 503);
  }

  const contentType = c.req.header('content-type') ?? '';
  let email = '';

  if (contentType.includes('application/json')) {
    try {
      const body = await c.req.json<{ email?: string }>();
      email = body.email?.trim().toLowerCase() ?? '';
    } catch {
      return c.json({ error: 'Invalid request body. Expected JSON.' }, 400);
    }
  } else {
    const body = await c.req.parseBody();
    const formEmail = body.email;

    email = typeof formEmail === 'string' ? formEmail.trim().toLowerCase() : '';
  }

  if (!email || !EMAIL_REGEX.test(email)) {
    return c.json({ error: 'A valid email is required.' }, 400);
  }

  await db
    .insert(newsletterSubscriptions)
    .values({
      email,
      createdAt: new Date(),
    })
    .onConflictDoNothing();

  return c.json({ ok: true, message: 'You are now subscribed to the newsletter.' }, 201);
});

export { app };
export type AppType = typeof app;
