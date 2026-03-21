INSERT INTO blogs (slug, title, description, hero_image, tags, category, published_at, updated_at, is_published)
VALUES
  ('web-component-performance-budgeting', 'Web Component Performance Budgeting', 'How to define and enforce per-component performance budgets in design systems.', '../../assets/blog-placeholder-1.jpg', '["web-components","performance","design-systems"]', 'Web Dev', 1771718400000, NULL, 1),
  ('hydration-debugging-checklist', 'Hydration Debugging Checklist For Production Apps', 'A repeatable checklist for diagnosing hydration mismatches and rendering divergence.', '../../assets/blog-placeholder-2.jpg', '["hydration","debugging","ssr"]', 'Web Dev', 1771804800000, NULL, 1),
  ('modern-css-layout-audit', 'Modern CSS Layout Audit Playbook', 'Audit layouts for overflow, spacing drift, and breakpoint regressions with confidence.', '../../assets/blog-placeholder-3.jpg', '["css","responsive","frontend"]', 'Web Dev', 1771891200000, NULL, 1),
  ('frontend-release-notes-discipline', 'Frontend Release Notes Discipline', 'Create release notes that help engineers and support teams trace UI changes quickly.', '../../assets/blog-placeholder-4.jpg', '["release-management","frontend","ops"]', 'Web Dev', 1771977600000, NULL, 1),
  ('browser-storage-strategy-guide', 'Browser Storage Strategy Guide', 'Choosing between cookies, localStorage, sessionStorage, and IndexedDB for real apps.', '../../assets/blog-placeholder-5.jpg', '["browser","storage","web-architecture"]', 'Web Dev', 1772064000000, NULL, 1),
  ('runtime-feature-detection-patterns', 'Runtime Feature Detection Patterns', 'Use capability checks to ship resilient experiences across changing browser support.', '../../assets/blog-placeholder-1.jpg', '["progressive-enhancement","compatibility","javascript"]', 'Web Dev', 1772150400000, NULL, 1),
  ('frontend-incident-response', 'Frontend Incident Response For User-Facing Outages', 'An incident workflow for diagnosing UI breakage, rollback strategy, and postmortems.', '../../assets/blog-placeholder-2.jpg', '["incident-response","reliability","frontend"]', 'Web Dev', 1772236800000, NULL, 1),
  ('contract-testing-ui-integrations', 'Contract Testing UI Integrations', 'Prevent API drift from breaking frontend flows with lightweight contract tests.', '../../assets/blog-placeholder-3.jpg', '["contract-testing","api","quality"]', 'Web Dev', 1772323200000, NULL, 1),
  ('design-review-automation', 'Design Review Automation For Frontend Teams', 'Automate visual and interaction checks in CI to reduce regressions before merge.', '../../assets/blog-placeholder-4.jpg', '["design-review","automation","ci"]', 'Web Dev', 1772409600000, NULL, 1),
  ('maintainable-frontend-architecture', 'Maintainable Frontend Architecture In Multi-Team Orgs', 'A governance model that keeps frontend standards consistent across teams and repos.', '../../assets/blog-placeholder-5.jpg', '["architecture","governance","frontend"]', 'Web Dev', 1772496000000, NULL, 1)
ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  description = excluded.description,
  hero_image = excluded.hero_image,
  tags = excluded.tags,
  category = excluded.category,
  published_at = excluded.published_at,
  updated_at = excluded.updated_at,
  is_published = excluded.is_published;
