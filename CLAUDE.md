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
│   ├── shared.css      Global styles used by ALL pages
│   ├── home.css        Home-only hero (.hero-section, .hero-spacer, .sticky-hero)
│   └── pages.css       Inner page hero (.page-hero, .page-title, .hero-subtext)
├── js/
│   └── shared.js       All JS for all pages (one file)
└── assets/
    ├── photoForWebsiteCropped.jpg   Profile photo
    └── cv.pdf                        Downloadable CV
```

## CSS Split Logic

- `index.html` loads `shared.css` + `home.css`
- All other pages load `shared.css` + `pages.css`
- Never load both `home.css` and `pages.css` on the same page

## JS Architecture (`js/shared.js`)

The single JS file branches on whether `#photo-wrapper` exists in the DOM:

- **`#photo-wrapper` present (home page):** Full photo animation — large photo centered in hero spacer animates to small photo in header as user scrolls. Header fades in, nav fades in, identity text fades in.
- **`#photo-wrapper` absent (inner pages):** Header shown fully opaque immediately, nav and identity text visible from load. No animation setup.

Both paths share: sticky section title slab effect (`updateStickyHeaders`), reveal-on-scroll (`IntersectionObserver`), bokeh canvas animation, and active nav link highlighting via `window.location.pathname`.

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

- Papers numbered 1–9 (published, newest first) + preprints section
- Numbers are manual badges, not CSS counters — update them when adding/removing papers
- Collapsible abstracts use native `<details>`/`<summary>` — no JS needed
- Preprint cards use inline `style="border-left: 4px solid #f0a500"` + `.badge-preprint` class

## Contact Form

Formspree endpoint `xjgabnqb` is live in `js/contact.js` line 3. The form on `contact.html` is fully functional. To protect against spam, enable the domain whitelist in the Formspree dashboard so submissions are only accepted from `sonaldeephalder.github.io`.

## Key CSS Variables (`shared.css`)

```css
--header-height: 80px
--bg-color: #ffffff
--text-main: #1d1d1f
--accent: #0071e3
```

`--header-height` is used in `position: sticky; top: var(--header-height)` throughout — change it in one place.
