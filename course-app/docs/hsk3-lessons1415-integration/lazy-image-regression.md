# Native city-image readiness repair

First candidate29b96cdb5cfe34a61fc3821fec5b47abb136e84e, run37183716526, exposed a Chromium preflight failure in the320px four-city task. The image complete/naturalWidth poll ran on offscreen lazy-loaded images before any scrolling. The source renderer deliberately sets loading=lazy. The full section traversal already scrolls each image before the same decode check.

The repair adds image.scrollIntoViewIfNeeded() for each city image before the existing complete/naturalWidth poll. No app code, image loading behavior, source data, test title, expected figure count/order, geometric ordering, overflow, persistence, screenshot or ungraded-feedback assertion changes. Retries remain0 and workers1. Full native rerun is required; collection alone is not success.
