import { env } from "cloudflare:workers";
import { desc, eq } from "drizzle-orm";
import rss from '@astrojs/rss';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';
import { getDb } from "../lib/server/db/client";
import { blogs } from "../lib/server/db/schema";
import { FALLBACK_BLOGS } from "../lib/server/fallback-blogs";

export async function GET(context) {
	const db = getDb(env);
	const dbPosts = db
		? await db
				.select({
					slug: blogs.slug,
					title: blogs.title,
					description: blogs.description,
					tags: blogs.tags,
					publishedAt: blogs.publishedAt,
				})
				.from(blogs)
				.where(eq(blogs.isPublished, true))
				.orderBy(desc(blogs.publishedAt))
				.limit(200)
		: [];

	const posts =
		dbPosts.length > 0
			? dbPosts.map((post) => ({
					slug: post.slug,
					title: post.title,
					description: post.description,
					tags: Array.isArray(post.tags) ? post.tags : [],
					publishedAt: post.publishedAt,
			  }))
			: FALLBACK_BLOGS.map((post) => ({
					slug: post.slug,
					title: post.title,
					description: post.description,
					tags: Array.isArray(post.tags) ? post.tags : [],
					publishedAt: post.publishedAt,
			  }));

	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		items: posts.map((post) => ({
			title: post.title,
			description: post.description,
			pubDate: post.publishedAt,
			categories: post.tags,
			link: `/blog/${post.slug}/`,
		})),
	});
}
