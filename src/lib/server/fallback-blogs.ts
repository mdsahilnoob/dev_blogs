export type FallbackBlog = {
  slug: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  publishedAt: Date;
  updatedAt?: Date;
};

export const FALLBACK_BLOGS: FallbackBlog[] = [
  {
    slug: "maintainable-frontend-architecture",
    title: "Maintainable Frontend Architecture In Multi-Team Orgs",
    description: "A governance model that keeps frontend standards consistent across teams and repos.",
    category: "Web Dev",
    tags: ["architecture", "governance", "frontend"],
    publishedAt: new Date("2026-03-02T00:00:00Z"),
  },
  {
    slug: "design-review-automation",
    title: "Design Review Automation For Frontend Teams",
    description: "Automate visual and interaction checks in CI to reduce regressions before merge.",
    category: "Web Dev",
    tags: ["design-review", "automation", "ci"],
    publishedAt: new Date("2026-03-01T00:00:00Z"),
  },
  {
    slug: "contract-testing-ui-integrations",
    title: "Contract Testing UI Integrations",
    description: "Prevent API drift from breaking frontend flows with lightweight contract tests.",
    category: "Web Dev",
    tags: ["contract-testing", "api", "quality"],
    publishedAt: new Date("2026-02-28T00:00:00Z"),
  },
  {
    slug: "frontend-incident-response",
    title: "Frontend Incident Response For User-Facing Outages",
    description: "An incident workflow for diagnosing UI breakage, rollback strategy, and postmortems.",
    category: "Web Dev",
    tags: ["incident-response", "reliability", "frontend"],
    publishedAt: new Date("2026-02-27T00:00:00Z"),
  },
  {
    slug: "runtime-feature-detection-patterns",
    title: "Runtime Feature Detection Patterns",
    description: "Use capability checks to ship resilient experiences across changing browser support.",
    category: "Web Dev",
    tags: ["progressive-enhancement", "compatibility", "javascript"],
    publishedAt: new Date("2026-02-26T00:00:00Z"),
  },
  {
    slug: "browser-storage-strategy-guide",
    title: "Browser Storage Strategy Guide",
    description: "Choosing between cookies, localStorage, sessionStorage, and IndexedDB for real apps.",
    category: "Web Dev",
    tags: ["browser", "storage", "web-architecture"],
    publishedAt: new Date("2026-02-25T00:00:00Z"),
  },
  {
    slug: "frontend-release-notes-discipline",
    title: "Frontend Release Notes Discipline",
    description: "Create release notes that help engineers and support teams trace UI changes quickly.",
    category: "Web Dev",
    tags: ["release-management", "frontend", "ops"],
    publishedAt: new Date("2026-02-24T00:00:00Z"),
  },
  {
    slug: "modern-css-layout-audit",
    title: "Modern CSS Layout Audit Playbook",
    description: "Audit layouts for overflow, spacing drift, and breakpoint regressions with confidence.",
    category: "Web Dev",
    tags: ["css", "responsive", "frontend"],
    publishedAt: new Date("2026-02-23T00:00:00Z"),
  },
  {
    slug: "hydration-debugging-checklist",
    title: "Hydration Debugging Checklist For Production Apps",
    description: "A repeatable checklist for diagnosing hydration mismatches and rendering divergence.",
    category: "Web Dev",
    tags: ["hydration", "debugging", "ssr"],
    publishedAt: new Date("2026-02-22T00:00:00Z"),
  },
  {
    slug: "web-component-performance-budgeting",
    title: "Web Component Performance Budgeting",
    description: "How to define and enforce per-component performance budgets in design systems.",
    category: "Web Dev",
    tags: ["web-components", "performance", "design-systems"],
    publishedAt: new Date("2026-02-21T00:00:00Z"),
  },
];

