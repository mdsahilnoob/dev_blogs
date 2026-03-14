import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const news = sqliteTable(
  'news',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('title').notNull(),
    sourceUrl: text('source_url').notNull(),
    sourceName: text('source_name').notNull(),
    author: text('author'),
    contentSummary: text('content_summary').notNull(),
    category: text('category').notNull(),
    readingTimeMinutes: integer('reading_time_minutes').notNull().default(1),
    publishedAt: integer('published_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => ({
    sourceUrlUniqueIdx: uniqueIndex('news_source_url_unique_idx').on(table.sourceUrl),
    categoryIdx: index('news_category_idx').on(table.category),
    publishedAtIdx: index('news_published_at_idx').on(table.publishedAt),
  })
);

export const blogs = sqliteTable(
  'blogs',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    heroImage: text('hero_image'),
    tags: text('tags', { mode: 'json' }).$type<string[]>().notNull(),
    category: text('category').notNull(),
    publishedAt: integer('published_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }),
    isPublished: integer('is_published', { mode: 'boolean' }).notNull().default(true),
  },
  (table) => ({
    slugUniqueIdx: uniqueIndex('blogs_slug_unique_idx').on(table.slug),
    publishedAtIdx: index('blogs_published_at_idx').on(table.publishedAt),
  })
);

export const newsletterSubscriptions = sqliteTable(
  'newsletter_subscriptions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    email: text('email').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => ({
    emailUniqueIdx: uniqueIndex('newsletter_email_unique_idx').on(table.email),
  })
);

export type NewsRecord = typeof news.$inferSelect;
export type BlogRecord = typeof blogs.$inferSelect;
