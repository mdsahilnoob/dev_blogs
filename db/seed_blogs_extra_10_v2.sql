INSERT INTO blogs (slug, title, description, hero_image, tags, category, published_at, updated_at, is_published)
VALUES
  ('frontend-event-streaming-patterns', 'Frontend Event Streaming Patterns', 'Reliable UI update strategies for event-driven dashboards using streams and incremental rendering.', '../../assets/blog-placeholder-1.jpg', '["events","streaming","frontend"]', 'Web Dev', 1774137600000, NULL, 1),
  ('typed-routes-for-large-web-apps', 'Typed Routes For Large Web Apps', 'How to enforce route contracts with compile-time checks to prevent navigation regressions.', '../../assets/blog-placeholder-2.jpg', '["routing","typescript","web-architecture"]', 'Web Dev', 1774224000000, NULL, 1),
  ('websocket-reconnect-strategies', 'WebSocket Reconnect Strategies', 'Backoff, jitter, and state reconciliation patterns for resilient real-time user interfaces.', '../../assets/blog-placeholder-3.jpg', '["websocket","realtime","reliability"]', 'Web Dev', 1774310400000, NULL, 1),
  ('progressive-hydration-case-study', 'Progressive Hydration Case Study', 'Reducing interaction delay by hydrating only critical islands first on high-traffic pages.', '../../assets/blog-placeholder-4.jpg', '["hydration","astro","performance"]', 'Web Dev', 1774396800000, NULL, 1),
  ('frontend-capacity-planning', 'Frontend Capacity Planning For Peak Traffic', 'Prepare web apps for launch spikes with asset strategy, caching layers, and synthetic load tests.', '../../assets/blog-placeholder-5.jpg', '["capacity","performance","cdn"]', 'Web Dev', 1774483200000, NULL, 1),
  ('api-schema-evolution-guide', 'API Schema Evolution Guide For UI Teams', 'Practical versioning and compatibility workflows that keep frontend teams unblocked.', '../../assets/blog-placeholder-1.jpg', '["api","schema","contracts"]', 'Web Dev', 1774569600000, NULL, 1),
  ('design-system-adoption-metrics', 'Design System Adoption Metrics', 'What to measure so your design system investment improves delivery speed and quality.', '../../assets/blog-placeholder-2.jpg', '["design-system","metrics","frontend"]', 'Web Dev', 1774656000000, NULL, 1),
  ('critical-path-javascript-pruning', 'Critical-Path JavaScript Pruning', 'A production method for identifying and removing non-critical JavaScript on key routes.', '../../assets/blog-placeholder-3.jpg', '["javascript","performance","core-web-vitals"]', 'Web Dev', 1774742400000, NULL, 1),
  ('frontend-rollbacks-with-confidence', 'Frontend Rollbacks With Confidence', 'Rollback orchestration for static assets and API compatibility without breaking active sessions.', '../../assets/blog-placeholder-4.jpg', '["deployments","rollback","reliability"]', 'Web Dev', 1774828800000, NULL, 1),
  ('state-synchronization-across-tabs', 'State Synchronization Across Browser Tabs', 'Cross-tab state consistency patterns using BroadcastChannel, storage events, and server truth.', '../../assets/blog-placeholder-5.jpg', '["state-management","browser","ux"]', 'Web Dev', 1774915200000, NULL, 1)
ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  description = excluded.description,
  hero_image = excluded.hero_image,
  tags = excluded.tags,
  category = excluded.category,
  published_at = excluded.published_at,
  updated_at = excluded.updated_at,
  is_published = excluded.is_published;
