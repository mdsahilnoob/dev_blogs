import { XMLParser } from "fast-xml-parser";

export type EngineeringFeed = {
  id: string;
  name: string;
  url: string;
};

export type EngineeringNewsItem = {
  title: string;
  sourceUrl: string;
  contentSummary: string;
  sourceName: string;
  author: string | null;
  category: string;
  publishedAt: Date;
  readingTimeMinutes: number;
};

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  trimValues: true,
});

export const ENGINEERING_FEEDS: EngineeringFeed[] = [
  { id: "netflix", name: "Netflix Tech Blog", url: "https://netflixtechblog.com/feed" },
  { id: "meta", name: "Meta Engineering", url: "https://engineering.fb.com/feed/" },
  { id: "linkedin", name: "LinkedIn Engineering", url: "https://engineering.linkedin.com/blog.rss" },
  { id: "uber", name: "Uber Engineering", url: "https://www.uber.com/blog/engineering/rss/" },
  { id: "airbnb", name: "Airbnb Tech Blog", url: "https://medium.com/feed/airbnb-engineering" },
  { id: "discord", name: "Discord Blog", url: "https://discord.com/blog/rss" },
  { id: "cloudflare", name: "Cloudflare Blog", url: "https://blog.cloudflare.com/rss/" },
  { id: "github", name: "GitHub Blog", url: "https://github.blog/feed/" },
];

const CATEGORY_RULES: Array<{ category: string; keywords: string[] }> = [
  {
    category: "AI/ML",
    keywords: ["ai", "ml", "machine learning", "model", "llm", "neural", "inference"],
  },
  {
    category: "Web Dev",
    keywords: ["react", "css", "frontend", "ui", "ux", "javascript", "typescript", "web"],
  },
  {
    category: "Cloud/DevOps",
    keywords: ["kubernetes", "aws", "s3", "cloud", "devops", "terraform", "container", "kafka"],
  },
  {
    category: "Security",
    keywords: ["security", "vulnerability", "attack", "exploit", "auth", "zero trust", "encryption"],
  },
  {
    category: "Data Systems",
    keywords: ["pipeline", "data", "warehouse", "stream", "batch", "etl", "analytics", "geospatial"],
  },
  {
    category: "Infrastructure",
    keywords: ["microservice", "infrastructure", "scaling", "distributed", "edge", "network", "chaos"],
  },
];

const FALLBACK_NEWS: EngineeringNewsItem[] = [
  {
    title: "Hardening microservice communication patterns at global scale",
    sourceUrl: "https://netflixtechblog.com/",
    contentSummary: "A practical look at resilient service communication and failure isolation in production systems.",
    sourceName: "Netflix Tech Blog",
    author: "Netflix Engineering",
    category: "Infrastructure",
    publishedAt: new Date("2026-03-11T08:00:00Z"),
    readingTimeMinutes: 8,
  },
  {
    title: "Model serving reliability lessons from production AI systems",
    sourceUrl: "https://engineering.fb.com/",
    contentSummary: "Meta engineers share design principles for safe model rollout and observability.",
    sourceName: "Meta Engineering",
    author: "Meta Engineering",
    category: "AI/ML",
    publishedAt: new Date("2026-03-10T10:00:00Z"),
    readingTimeMinutes: 7,
  },
  {
    title: "Building Kafka-powered data products for enterprise workflows",
    sourceUrl: "https://engineering.linkedin.com/",
    contentSummary: "How LinkedIn teams structure high-throughput event pipelines for business-critical products.",
    sourceName: "LinkedIn Engineering",
    author: "LinkedIn Engineering",
    category: "Data Systems",
    publishedAt: new Date("2026-03-09T09:30:00Z"),
    readingTimeMinutes: 6,
  },
];

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function normalizeWhitespace(input: string | undefined) {
  return (input ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function estimateReadingTime(content: string) {
  const words = normalizeWhitespace(content).split(" ").filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

function categorizeText(title: string, summary: string) {
  const haystack = `${title} ${summary}`.toLowerCase();

  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((keyword) => haystack.includes(keyword))) {
      return rule.category;
    }
  }

  return "Engineering";
}

function parsePublishedDate(value: string | undefined) {
  if (!value) {
    return new Date();
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.valueOf())) {
    return new Date();
  }

  return parsed;
}

function pickText(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const picked = pickText(item);

      if (picked) {
        return picked;
      }
    }
  }

  if (typeof value === "object" && value && "#text" in (value as Record<string, unknown>)) {
    return String((value as Record<string, unknown>)["#text"] ?? "");
  }

  return "";
}

function pickLink(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    const preferred = value.find((item) => {
      if (!item || typeof item !== "object") {
        return false;
      }

      const rel = String((item as Record<string, unknown>)["@_rel"] ?? "");
      return rel === "" || rel === "alternate";
    });

    if (preferred) {
      return pickLink(preferred);
    }

    return pickLink(value[0]);
  }

  if (typeof value === "object" && value) {
    const record = value as Record<string, unknown>;

    if (typeof record["@_href"] === "string") {
      return record["@_href"] as string;
    }

    if (typeof record["href"] === "string") {
      return record["href"] as string;
    }
  }

  return "";
}

function pickAuthor(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const picked = pickAuthor(item);

      if (picked) {
        return picked;
      }
    }

    return "";
  }

  if (typeof value === "object" && value) {
    const record = value as Record<string, unknown>;
    const fromName = pickText(record.name);

    if (fromName) {
      return fromName;
    }
  }

  return pickText(value);
}

function parseFeedEntries(feedXml: string) {
  const parsed = xmlParser.parse(feedXml) as Record<string, any>;

  if (parsed.rss?.channel?.item) {
    return asArray(parsed.rss.channel.item).map((item: Record<string, unknown>) => ({
      title: pickText(item.title),
      link: pickLink(item.link),
      author: pickText(item["dc:creator"] ?? item.author),
      summary: pickText(item.description ?? item["content:encoded"]),
      publishedAt: pickText(item.pubDate),
    }));
  }

  if (parsed.feed?.entry) {
    return asArray(parsed.feed.entry).map((entry: Record<string, unknown>) => ({
      title: pickText(entry.title),
      link: pickLink(entry.link),
      author: pickAuthor(entry.author),
      summary: pickText(entry.summary ?? entry.content),
      publishedAt: pickText(entry.updated ?? entry.published),
    }));
  }

  return [];
}

function toEngineeringNewsItem(
  feed: EngineeringFeed,
  rawItem: { title: string; link: string; author: string; summary: string; publishedAt: string }
): EngineeringNewsItem | null {
  const title = normalizeWhitespace(rawItem.title);
  const sourceUrl = normalizeWhitespace(rawItem.link);

  if (!title || !sourceUrl) {
    return null;
  }

  const summary = normalizeWhitespace(rawItem.summary || "No summary provided.");

  return {
    title,
    sourceUrl,
    contentSummary: summary.slice(0, 320),
    sourceName: feed.name,
    author: normalizeWhitespace(rawItem.author) || null,
    category: categorizeText(title, summary),
    publishedAt: parsePublishedDate(rawItem.publishedAt),
    readingTimeMinutes: estimateReadingTime(summary),
  };
}

async function fetchFeed(feed: EngineeringFeed, maxPerFeed: number) {
  const response = await fetch(feed.url, {
    signal: AbortSignal.timeout(10000),
    headers: {
      "user-agent": "DevWireTimesAggregator/1.0",
      accept: "application/rss+xml, application/xml, text/xml",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed feed ${feed.name}: ${response.status}`);
  }

  const xml = await response.text();

  return parseFeedEntries(xml)
    .slice(0, maxPerFeed)
    .map((item) => toEngineeringNewsItem(feed, item))
    .filter((item): item is EngineeringNewsItem => Boolean(item));
}

export async function fetchEngineeringNews(maxPerFeed = 10): Promise<EngineeringNewsItem[]> {
  const settled = await Promise.allSettled(ENGINEERING_FEEDS.map((feed) => fetchFeed(feed, maxPerFeed)));

  const aggregated = settled.flatMap((result) => (result.status === "fulfilled" ? result.value : []));

  if (aggregated.length === 0) {
    return [...FALLBACK_NEWS];
  }

  const deduped = new Map<string, EngineeringNewsItem>();

  for (const item of aggregated) {
    if (!deduped.has(item.sourceUrl)) {
      deduped.set(item.sourceUrl, item);
    }
  }

  return [...deduped.values()].sort((a, b) => b.publishedAt.valueOf() - a.publishedAt.valueOf());
}

export async function getCategorizedEngineeringNews(limit = 60) {
  const all = await fetchEngineeringNews(12);
  const limited = all.slice(0, limit);

  const byCategory = limited.reduce<Record<string, EngineeringNewsItem[]>>((acc, item) => {
    acc[item.category] ??= [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const categories = Object.entries(byCategory)
    .map(([name, items]) => ({ name, count: items.length }))
    .sort((a, b) => b.count - a.count);

  const sources = limited.reduce<Record<string, number>>((acc, item) => {
    acc[item.sourceName] = (acc[item.sourceName] ?? 0) + 1;
    return acc;
  }, {});

  const sourceList = Object.entries(sources)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return {
    items: limited,
    byCategory,
    categories,
    sources: sourceList,
  };
}
