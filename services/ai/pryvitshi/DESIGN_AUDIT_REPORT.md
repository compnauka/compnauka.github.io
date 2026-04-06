# Design Audit Report

Project: `services/ai/pryvitshi`  
Date: `2026-04-05`  
Scope: `index.html`, `style.css`, `main.js`, `bookSections.js`, and the repository file set

## Summary

The project is visually polished and friendly, but it diverges from the project standards in several important ways. The biggest gaps are accessibility, privacy, offline support, and design-system discipline.

The most important issues are:

1. Zoom is disabled in the viewport meta tag.
2. Third-party analytics are embedded despite the privacy rules for a child-focused educational product.
3. The project does not include the required PWA/offline foundation.
4. Styling is not token-driven and uses many hardcoded values.
5. Keyboard accessibility and focus management are incomplete.
6. Some media and content patterns do not fully meet the accessibility standards.

## What Is Good Already

- The layout is simple and easy to scan.
- Primary navigation is visible and obvious.
- Buttons are large enough for touch interaction in most places.
- The interface uses a clear visual hierarchy with cards, spacing, and contrast.
- Progress is persisted in `localStorage`, which helps continuity.

## Priority Findings

### 1. Zoom is blocked

File: [`index.html`](./index.html)

The viewport meta tag includes `user-scalable=no`, which prevents pinch zoom and browser zoom behavior on mobile devices.

Why this matters:

- It conflicts with the accessibility standards.
- It hurts low-vision users and users who need larger text.
- It is specifically prohibited in the project standards.

Recommended fix:

- Remove `maximum-scale=1.0, user-scalable=no`.
- Keep a standard responsive viewport meta tag.

### 2. Analytics conflict with child-safety/privacy rules

File: [`index.html`](./index.html)

The page loads Google Analytics and Plausible analytics scripts.

Why this matters:

- The standards prohibit tracking pixels and third-party tracking for this project.
- This is especially sensitive because the target audience includes children.

Recommended fix:

- Remove tracking by default.
- If analytics are absolutely required, add explicit consent and keep them off until consent is granted.

### 3. No PWA/offline implementation

Repository files: no `manifest.json`, no `sw.js`, no `offline.html`

The standards require a manifest, a service worker, and an offline fallback.

Why this matters:

- The project is meant to work in unstable school connectivity.
- Users should still be able to load the app and access cached content offline.

Recommended fix:

- Add `manifest.json`.
- Add a service worker with cache-first static assets and offline fallback.
- Add `offline.html` with a friendly state and cached-content explanation.

### 4. Design tokens are not centralized

Files: [`style.css`](./style.css), [`index.html`](./index.html), [`main.js`](./main.js)

The project uses many hardcoded values:

- Color values are embedded directly in classes and CSS.
- Spacing is not governed by a shared token file.
- Radius and shadow values are mixed across utility classes and custom CSS.
- `!important` is used in several places.

Why this matters:

- It weakens consistency.
- It makes maintenance harder.
- It conflicts with the token-only design rule in the standards.

Recommended fix:

- Introduce `tokens.css` or `tokens.json`.
- Move shared colors, spacing, shadows, and radii into tokens.
- Reduce or eliminate `!important`.

### 5. Keyboard and focus support need strengthening

Files: [`index.html`](./index.html), [`main.js`](./main.js)

Issues identified:

- There is no skip-link to main content.
- The mobile menu button lacks explicit `aria-expanded` and `aria-controls`.
- The menu does not appear to support Escape-to-close.
- Focus trapping for the open menu is not implemented.

Why this matters:

- Keyboard users may struggle to navigate the app efficiently.
- Screen reader and assistive-tech users need predictable focus behavior.

Recommended fix:

- Add a skip-link before the main content.
- Add proper ARIA state to the menu toggle.
- Implement Escape-to-close and focus return.
- Ensure the sidebar behaves like a proper modal on mobile.

### 6. Media accessibility needs improvement

Files: [`main.js`](./main.js), [`bookSections.js`](./bookSections.js)

Issues identified:

- Image `alt` text is generic in some places.
- Audio has no visible transcript or text fallback.
- Some content is rich HTML embedded directly in data, which makes i18n and accessibility harder.

Why this matters:

- Generic alt text is less helpful for blind users.
- Audio without text alternative reduces accessibility.
- Content encoded as raw HTML is harder to translate and maintain.

Recommended fix:

- Replace generic alt text with descriptive, context-aware text.
- Add transcripts or summarized text for audio content.
- Move visible copy into structured language resources.

### 7. Performance and responsiveness can be improved

Files: [`index.html`](./index.html), [`main.js`](./main.js), [`style.css`](./style.css)

Issues identified:

- Tailwind is loaded from the CDN at runtime.
- Images do not define explicit `width` and `height`, which can increase layout shift risk.
- Styling depends on a mix of utility classes and local CSS overrides.

Why this matters:

- Runtime CDN loading is less stable than bundled assets.
- Layout shift hurts perceived quality and Core Web Vitals.

Recommended fix:

- Prefer a local build or compiled CSS pipeline if the project grows.
- Add image dimensions where possible.
- Keep responsive behavior within a centralized design system.

## Standards Gap by Area

### Accessibility

- Zoom is blocked.
- Skip navigation is missing.
- Focus handling is incomplete.
- Media alternatives are incomplete.
- Keyboard support could be stronger.

### Privacy

- Third-party analytics are present.
- The project does not currently follow the strict child-safety privacy posture in the standards.

### Design System

- No shared token file exists.
- Colors and spacing are hardcoded.
- The project uses a mixed pattern of utility classes and custom CSS overrides.

### PWA / Offline

- Missing manifest.
- Missing service worker.
- Missing offline fallback page.

### Content Architecture

- Copy is hardcoded directly into `bookSections.js`.
- The project is not prepared for localization or content scaling.

## Recommended Fix Order

1. Remove `user-scalable=no`.
2. Remove or gate analytics behind consent.
3. Add skip-link and improve keyboard/focus behavior.
4. Create `tokens.css` and move shared visual values into tokens.
5. Add `manifest.json`, `sw.js`, and `offline.html`.
6. Improve `alt` text and add transcript/fallback text for audio.
7. Refactor content into structured language resources.

## Notes

- The app is already pleasant and easy to use visually.
- The main work is bringing it into alignment with the project standards, not redesigning it from scratch.
- The biggest risk is that the current implementation looks finished but still violates several non-negotiable rules.

