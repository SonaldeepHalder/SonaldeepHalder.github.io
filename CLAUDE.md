# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static academic personal website for Sonaldeep Halder (PhD researcher, IIT Bombay). No build system, no npm, no framework — pure HTML/CSS/JS, opened directly in a browser via `file://` or served from GitHub Pages.

## Previewing Changes

Open any HTML file directly in a browser:
```
open index.html
open research.html
open publications.html
open cv.html
open contact.html
```

No server required. All paths are relative, so `file://` works correctly.

## File Structure & Architecture

```
/
├── index.html          Home — photo animation + summary sections
├── research.html       Research themes + ongoing projects
├── publications.html   All papers with collapsible abstracts
├── cv.html             Full academic CV + PDF download
├── contact.html        Email + academic profiles + contact form
├── css/
│   ├── fonts.css       Self-hosted Inter @font-face rules (loaded FIRST on every page)
│   ├── shared.css      Global styles used by ALL pages
│   ├── home.css        Home-only hero (.hero-section, .hero-spacer, .sticky-hero)
│   └── pages.css       Inner page hero (.page-hero, .page-title, .hero-subtext)
├── js/
│   └── shared.js       All JS for all pages (one file)
├── fonts/              Inter variable woff2 (latin + latin-ext, normal + italic)
└── assets/
    ├── profile-600.jpg              Profile photo, 600×600 — largest srcset candidate
    ├── profile-336.jpg              hero @2x/@3x
    ├── profile-160.jpg              hero @1x / header avatar @3x
    ├── profile-100.jpg              header avatar @1x/@2x
    ├── og-image.jpg                 1200×1117 — og:image / twitter:image on all pages
    ├── favicon.svg                  SH monogram favicon
    ├── apple-touch-icon.png         180×180 touch icon
    └── photoForWebsiteCropped.jpg   Original full-res photo (gitignored, never published)
```

`assets/cv.pdf` was **removed** — it was a personal-details CV (date of birth, father's
name, religion, marital status, address, mobile number) that was tracked and served
publicly. Do not re-add it. If a downloadable CV is wanted, export a fresh one from
`cv-print.html`, which carries only professional information.

## Profile photo — responsive srcset

Every `<img>` carries the same 4-candidate `srcset`. The `sizes` attribute differs by role:

- Inner-page header avatar (50px desktop / 36px mobile): `sizes="50px"`
- `index.html` — **both** the desktop `.photo-wrapper` img and the `.mobile-profile-img`
  use `sizes="(max-width: 768px) 112px, 300px"`. Keeping them identical is deliberate:
  the two imgs then always resolve to the *same* candidate, so the one that is
  `display: none` at that breakpoint costs no extra request.

A phone at dpr3 fetches 22 KB instead of the old flat 55 KB; an inner page fetches 6.6 KB.
Regenerate variants with Pillow (convert Display P3 → sRGB first, else stripping the
profile shifts colour), quality 82, progressive, 4:2:0.

## CV download

`cv.html` links to `cv-print.html` (a styled HTML page with a Print/Save-as-PDF button),
**not** to a PDF file. The button is labelled "Open Print-Ready CV" — do not relabel it
"Download PDF" unless it actually serves a file.

`cv-print.html` is public (linked from cv.html; `noindex` + robots.txt Disallow are
advisory only). Keep it to professional contact details — the institutional email and
profile links. A personal mobile number was removed from it for this reason.

## Header Blur — Critical Constraint

NEVER set `backdrop-filter` on `.fixed-header` (in CSS or JS). It makes the header the
containing block for the `position: fixed` mobile nav overlay inside it, collapsing the
full-screen menu to the header's box (this shipped broken until June 2026). The blur lives
on `.fixed-header::before`, driven by the `--header-blur` custom property which JS sets via
`header.style.setProperty('--header-blur', …)`. Mobile nav overlay styles live ONLY in
`mobile.css` — do not redefine `.nav-links` mobile styles in `shared.css`.

## Fonts & CSP

Inter is **self-hosted** (no Google Fonts requests). `css/fonts.css` declares variable-font
`@font-face` rules (weight range 300–700) pointing at `fonts/*.woff2`, with unicode-range so
browsers fetch only the latin file in practice. Because of this, the CSP on every page is
`style-src 'self'; font-src 'self'` — do NOT re-add fonts.googleapis.com/fonts.gstatic.com
links or preconnects. To change font weights, nothing is needed: the variable font covers
300–700 continuously.

## CSS Split Logic

- `index.html` loads `shared.css` + `home.css`
- All other pages load `shared.css` + `pages.css`
- Never load both `home.css` and `pages.css` on the same page

## JS Architecture (`js/shared.js`)

The single JS file branches on whether `#photo-wrapper` exists in the DOM:

- **`#photo-wrapper` present (home page):** Full photo animation — large photo centered in hero spacer animates to small photo in header as user scrolls. Header fades in, nav fades in, identity text fades in.
- **`#photo-wrapper` absent (inner pages):** Header shown fully opaque immediately, nav and identity text visible from load. No animation setup.

Both paths share: sticky section title slab effect (`updateStickyHeaders`), reveal-on-scroll (`IntersectionObserver`), bokeh canvas animation, and active nav link highlighting via `window.location.pathname`.

A cross-breakpoint reload listener is registered on every page/branch — it calls `location.reload()` **only when the mobile media query (`MOBILE_MEDIA`) actually flips**, so JS and CSS always agree on which breakpoint is active (covers both width and height-only crossings, e.g. orientation change). Resizing *within* a breakpoint does NOT reload: the desktop hero re-runs `recalculatePositions()` on `resize` to keep the photo centered, and the sticky/mobile scroll handlers read fresh geometry each frame. (Earlier versions also reloaded on any >50px width change — that was removed so ordinary desktop window resizing no longer reloads the page.)

## Mobile Breakpoint — Width OR Short Viewport

The mobile layout triggers at `(max-width: 768px), (max-height: 500px)` — the height clause makes **phones in landscape** (e.g. 844×390, width > 768px) use the mobile layout (60px header, hamburger, mobile hero) instead of the desktop one, which doesn't fit in ~390px of height. iPad landscape (1024×~690) stays desktop. This combined query must stay in sync in ALL of:

- `js/shared.js` — the `MOBILE_MEDIA` constant at the top of the file (used by every `isMobile` check and the bokeh skip)
- `css/mobile.css` — main block, reduced-motion block, scroll-progress block inside `@supports`
- `css/shared.css`, `css/home.css`, `css/pages.css`, `css/contact.css` — each file's mobile block

An additional `@media (max-height: 500px)` block at the end of `mobile.css` compacts the nav overlay (smaller links, scrollable, `justify-content: flex-start` — a centered flex column clips overflow at both ends) and the mobile hero so they fit in ~390px of height. The `max-width: 480px` blocks remain width-only (small-phone portrait refinements).

`updateStickyHeaders` only writes `backdropFilter`/`webkitBackdropFilter` as inline styles. Background, border, and box-shadow for the stuck state live in `.sticky-title.is-stuck` in `shared.css` so they remain CSS-inspectable.

## Home Page Animation Details

- `startSize` (photo at scroll=0): 300px desktop / 180px mobile
- `endSize` (photo in header at scroll≥400): 50px desktop / 40px mobile
- `startPhotoY`: 220px desktop / 140px mobile — offsets photo downward into the `.hero-spacer`
- `.hero-spacer` height: 480px desktop / 350px mobile — must be taller than `startPhotoY + startSize/2`
- `maxScroll = 400` — scroll distance over which the entire animation completes

## Inner Pages

Inner pages have NO `#photo-wrapper` in their header. The header shows:
- `.text-identity` (name + separator + role) — visible immediately via JS
- `.nav-links` — visible immediately via JS

The `.page-hero` section uses `padding-top: calc(var(--header-height) + 60px)` to clear the fixed header. No spacer needed.

## Active Nav Highlighting

`shared.js` reads `window.location.pathname.split('/').pop()` and adds `.active` class to the matching `<a>` in `.nav-links`. Each page's nav link `href` must exactly match the filename (e.g. `href="cv.html"`).

## Publications Page

- Papers numbered 1–10 (published, newest first) + preprints section
- Numbers are manual badges, not CSS counters — update them when adding/removing papers
- Collapsible abstracts use native `<details>`/`<summary>` — no JS needed
- Preprint cards use `.preprint-card` class for amber left-border + faint amber wash (defined in
  `shared.css` and `mobile.css`). Do NOT use inline `style=""` — violates `style-src 'self'` CSP.

## Contact Form

Formspree endpoint `xjgabnqb` is live in `js/contact.js` line 3. The form on `contact.html` is fully functional. To protect against spam, enable the domain whitelist in the Formspree dashboard so submissions are only accepted from `sonaldeephalder.github.io`.

## Key CSS Variables (`shared.css`)

```css
--header-height: 80px   /* overridden to 60px inside @media (max-width: 768px) in mobile.css */
--bg:            #fafafa
--bg-elevated:   #ffffff
--text:          #0a0a0b
--text-secondary: #3f3f46
--text-muted:    #6b6b74
--accent:        #2563eb
--accent-subtle: #dbeafe
```

Semantic aliases for backward compat: `--bg-color: var(--bg-elevated)`, `--text-main: var(--text)`.

`--header-height` is used in `position: sticky; top: var(--header-height)` throughout — change it in one place.
