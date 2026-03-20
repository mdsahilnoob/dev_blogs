import { desc } from "drizzle-orm";
import { Hono } from "hono";
import { validator } from "hono/validator";

import {
  ENGINEERING_FEEDS,
  fetchEngineeringNews,
  getCategorizedEngineeringNews,
} from "./engineering-news";
import type { ApiBindings } from "./db/client";
import { getDb } from "./db/client";
import type { NewsRecord } from "./db/schema";
import { newsletterSubscriptions, news } from "./db/schema";

type AppEnv = {
  Bindings: Partial<ApiBindings> & {
    SYNC_TOKEN?: string;
  };
};

type SerializedNews = Omit<NewsRecord, "publishedAt"> & {
  publishedAt: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parsePositiveInt(value: string | undefined, fallbackValue: number) {
  const parsed = Number.parseInt(value ?? "", 10);

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

const app = new Hono<AppEnv>();

app.get("/news/sources", (c) => {
  return c.json({
    data: ENGINEERING_FEEDS,
    total: ENGINEERING_FEEDS.length,
  });
});

app.get(
  "/news",
  validator("query", (value) => {
    return {
      page: parsePositiveInt(readSingleValue(value.page), 1),
      pageSize: Math.min(parsePositiveInt(readSingleValue(value.pageSize), 20), 100),
      category: readSingleValue(value.category)?.trim() || null,
      source: readSingleValue(value.source)?.trim() || null,
    };
  }),
  async (c) => {
    const { page, pageSize, category, source } = c.req.valid("query");
    const offset = (page - 1) * pageSize;

    const db = getDb(c.env);

    if (!db) {
      const feedData = await getCategorizedEngineeringNews(120);

      const filtered = feedData.items.filter((item) => {
        const categoryOk = !category || item.category.toLowerCase() === category.toLowerCase();
        const sourceOk = !source || item.sourceName.toLowerCase() === source.toLowerCase();
        return categoryOk && sourceOk;
      });

      const paged = filtered.slice(offset, offset + pageSize);
      const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

      return c.json({
        data: paged.map((item) => ({
          ...item,
          publishedAt: item.publishedAt.toISOString(),
        })),
        pagination: {
          page,
          pageSize,
          total: filtered.length,
          totalPages,
        },
        filters: {
          category,
          source,
        },
        facets: {
          categories: feedData.categories,
          sources: feedData.sources,
        },
      });
    }

    let rows = await db.select().from(news).orderBy(desc(news.publishedAt));

    if (category) {
      rows = rows.filter((row) => row.category.toLowerCase() === category.toLowerCase());
    }

    if (source) {
      rows = rows.filter((row) => row.sourceName.toLowerCase() === source.toLowerCase());
    }

    const total = rows.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const pagedRows = rows.slice(offset, offset + pageSize);

    const categories = rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.category] = (acc[row.category] ?? 0) + 1;
      return acc;
    }, {});

    const sources = rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.sourceName] = (acc[row.sourceName] ?? 0) + 1;
      return acc;
    }, {});

    return c.json({
      data: serializeNewsItems(pagedRows),
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
      filters: {
        category,
        source,
      },
      facets: {
        categories: Object.entries(categories).map(([name, count]) => ({ name, count })),
        sources: Object.entries(sources).map(([name, count]) => ({ name, count })),
      },
    });
  }
);

app.post("/news/sync", async (c) => {
  const db = getDb(c.env);

  if (!db) {
    return c.json({ error: 'D1 binding is not available. Expected "DB" or "devwire_db".' }, 503);
  }

  const syncToken = c.env.SYNC_TOKEN;
  const providedToken = c.req.header("x-sync-token");

  if (syncToken && providedToken !== syncToken) {
    return c.json({ error: "Unauthorized sync token." }, 401);
  }

  try {
    const fetched = await fetchEngineeringNews(15);

    if (fetched.length === 0) {
      return c.json({ ok: true, attempted: 0, message: "No items fetched from RSS feeds." });
    }

    const rows = fetched.map((item) => ({
      title: item.title,
      sourceUrl: item.sourceUrl,
      sourceName: item.sourceName,
      author: item.author,
      contentSummary: item.contentSummary,
      category: item.category,
      readingTimeMinutes: item.readingTimeMinutes,
      publishedAt: item.publishedAt,
    }));

    // Keep batch size small for D1 parameter and payload limits.
    const batchSize = 10;
    for (let i = 0; i < rows.length; i += batchSize) {
      const chunk = rows.slice(i, i + batchSize);
      await db.insert(news).values(chunk).onConflictDoNothing({ target: news.sourceUrl });
    }

    return c.json({
      ok: true,
      attempted: fetched.length,
      feeds: ENGINEERING_FEEDS.length,
      message: "RSS sync completed.",
    });
  } catch (error) {
    return c.json(
      {
        ok: false,
        error: "RSS sync failed.",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

app.post("/newsletter", async (c) => {
  const db = getDb(c.env);

  if (!db) {
    return c.json({ error: 'D1 binding is not available. Expected "DB" or "devwire_db".' }, 503);
  }

  const contentType = c.req.header("content-type") ?? "";
  let email = "";

  if (contentType.includes("application/json")) {
    try {
      const body = await c.req.json<{ email?: string }>();
      email = body.email?.trim().toLowerCase() ?? "";
    } catch {
      return c.json({ error: "Invalid request body. Expected JSON." }, 400);
    }
  } else {
    const body = await c.req.parseBody();
    const formEmail = body.email;

    email = typeof formEmail === "string" ? formEmail.trim().toLowerCase() : "";
  }

  if (!email || !EMAIL_REGEX.test(email)) {
    return c.json({ error: "A valid email is required." }, 400);
  }

  await db
    .insert(newsletterSubscriptions)
    .values({
      email,
      createdAt: new Date(),
    })
    .onConflictDoNothing();

  return c.json({ ok: true, message: "You are now subscribed to the newsletter." }, 201);
});

export { app };
export type AppType = typeof app;

