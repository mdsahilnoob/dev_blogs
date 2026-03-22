CREATE TABLE IF NOT EXISTS news (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_name TEXT NOT NULL,
  author TEXT,
  content_summary TEXT NOT NULL,
  category TEXT NOT NULL,
  reading_time_minutes INTEGER NOT NULL DEFAULT 1,
  published_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS news_source_url_unique_idx
  ON news(source_url);
CREATE INDEX IF NOT EXISTS news_category_idx
  ON news(category);
CREATE INDEX IF NOT EXISTS news_published_at_idx
  ON news(published_at);

CREATE TABLE IF NOT EXISTS blogs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  hero_image TEXT,
  tags TEXT NOT NULL,
  category TEXT NOT NULL,
  published_at INTEGER NOT NULL,
  updated_at INTEGER,
  is_published INTEGER NOT NULL DEFAULT 1
);

CREATE UNIQUE INDEX IF NOT EXISTS blogs_slug_unique_idx
  ON blogs(slug);
CREATE INDEX IF NOT EXISTS blogs_published_at_idx
  ON blogs(published_at);

CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS newsletter_email_unique_idx
  ON newsletter_subscriptions(email);
