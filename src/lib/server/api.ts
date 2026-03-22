import { and, desc, sql } from "drizzle-orm";
import { Hono } from "hono";
import { validator } from "hono/validator";

import {
  ENGINEERING_FEEDS,
  getCategorizedEngineeringNews,
} from "./engineering-news";
import type { ApiBindings } from "./db/client";
import { getDb } from "./db/client";
import type { NewsRecord } from "./db/schema";
import { newsletterSubscriptions, news } from "./db/schema";

type AppEnv = {
  Bindings: Partial<ApiBindings>;
};

type SerializedNews = Omit<NewsRecord, "publishedAt"> & {
  publishedAt: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NEWSLETTER_REDIRECT_BASE = "/#premium";

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
    const normalizedCategory = category?.toLowerCase() ?? null;
    const normalizedSource = source?.toLowerCase() ?? null;

    const db = getDb(c.env);

    if (!db) {
      const feedData = await getCategorizedEngineeringNews(120);

      const filtered = feedData.items.filter((item) => {
        const categoryOk = !normalizedCategory || item.category.toLowerCase() === normalizedCategory;
        const sourceOk = !normalizedSource || item.sourceName.toLowerCase() === normalizedSource;
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

    let whereCondition:
      | ReturnType<typeof sql>
      | ReturnType<typeof and>
      | undefined;

    if (normalizedCategory && normalizedSource) {
      whereCondition = and(
        sql`lower(${news.category}) = ${normalizedCategory}`,
        sql`lower(${news.sourceName}) = ${normalizedSource}`,
      );
    } else if (normalizedCategory) {
      whereCondition = sql`lower(${news.category}) = ${normalizedCategory}`;
    } else if (normalizedSource) {
      whereCondition = sql`lower(${news.sourceName}) = ${normalizedSource}`;
    }

    const totalRows = await db
      .select({
        total: sql<number>`count(*)`,
      })
      .from(news)
      .where(whereCondition);

    const total = Number(totalRows[0]?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const pagedRows = await db
      .select()
      .from(news)
      .where(whereCondition)
      .orderBy(desc(news.publishedAt))
      .limit(pageSize)
      .offset(offset);

    const categoryFacetRows = await db
      .select({
        name: news.category,
        count: sql<number>`count(*)`,
      })
      .from(news)
      .where(whereCondition)
      .groupBy(news.category);

    const sourceFacetRows = await db
      .select({
        name: news.sourceName,
        count: sql<number>`count(*)`,
      })
      .from(news)
      .where(whereCondition)
      .groupBy(news.sourceName);

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
        categories: categoryFacetRows
          .map((item) => ({ name: item.name, count: Number(item.count) }))
          .sort((a, b) => b.count - a.count),
        sources: sourceFacetRows
          .map((item) => ({ name: item.name, count: Number(item.count) }))
          .sort((a, b) => b.count - a.count),
      },
    });
  },
);

app.post("/newsletter", async (c) => {
  const contentType = c.req.header("content-type") ?? "";
  const expectsJson =
    contentType.includes("application/json") ||
    (c.req.header("accept") ?? "").includes("application/json");

  const db = getDb(c.env);

  if (!db) {
    if (expectsJson) {
      return c.json({ error: 'D1 binding is not available. Expected "DB" or "devwire_db".' }, 503);
    }

    return c.redirect(`${NEWSLETTER_REDIRECT_BASE}?newsletter=unavailable`, 303);
  }

  let email = "";

  if (contentType.includes("application/json")) {
    try {
      const body = await c.req.json<{ email?: string }>();
      email = body.email?.trim().toLowerCase() ?? "";
    } catch {
      if (expectsJson) {
        return c.json({ error: "Invalid request body. Expected JSON." }, 400);
      }

      return c.redirect(`${NEWSLETTER_REDIRECT_BASE}?newsletter=invalid`, 303);
    }
  } else {
    const body = await c.req.parseBody();
    const formEmail = body.email;

    email = typeof formEmail === "string" ? formEmail.trim().toLowerCase() : "";
  }

  if (!email || !EMAIL_REGEX.test(email)) {
    if (expectsJson) {
      return c.json({ error: "A valid email is required." }, 400);
    }

    return c.redirect(`${NEWSLETTER_REDIRECT_BASE}?newsletter=invalid`, 303);
  }

  await db
    .insert(newsletterSubscriptions)
    .values({
      email,
      createdAt: new Date(),
    })
    .onConflictDoNothing();

  if (expectsJson) {
    return c.json({ ok: true, message: "You are now subscribed to the newsletter." }, 201);
  }

  return c.redirect(`${NEWSLETTER_REDIRECT_BASE}?newsletter=subscribed`, 303);
});

export { app };
export type AppType = typeof app;