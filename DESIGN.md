---
version: alpha
colors:
  ink: "#090909"
  charcoal: "#141414"
  panel: "#1b1b1b"
  line: "#2b2b2b"
  white: "#f5f3ef"
  orange: "#ff6b2c"
  muted: "#8b8b8b"
  success: "#81bf91"
typography:
  display:
    fontFamily: "Space Grotesk, Arial, sans-serif"
  body:
    fontFamily: "DM Sans, Arial, sans-serif"
  utility:
    fontFamily: "DM Mono, monospace"
rounded:
  control: "5px"
  panel: "7px"
spacing:
  section: "7rem"
components:
  button:
    radius: "5px"
  panel:
    radius: "7px"
---

## Overview

VersionFlow uses a split register: the landing page is a restrained brand surface, while `/dashboard` is a familiar developer-tool workspace. The visual north star is a late-night engineering control room: black canvas, charcoal instruments, thin diagnostic rules, and orange signal markers. It must never resemble a bright generic SaaS template or a marketing page made of oversized gradients.

The signature is the ecosystem propagation diagram: an API node, a change signal, and connected dependency nodes. It embodies the product thesis and should remain the primary expressive device.

## Colors

The runtime source of truth is `apps/web/app/globals.css`; this document mirrors the semantic values. Ink and charcoal are structural surfaces. Orange is the brand/action/signal color, never the only indicator of status. Green, amber, and red are reserved for positive, warning, and breaking-change states.

## Typography

Space Grotesk carries headings and numeric metrics. DM Sans carries explanatory and interface copy. DM Mono is reserved for metadata, version strings, labels, and status signals. The external font import has system fallbacks so the layout remains usable if the font provider is unavailable.

## Layout

The landing page uses a wide 1240px frame, generous vertical sections, and hairline rules. The dashboard uses a persistent 244px sidebar on desktop and a slide-in sidebar on narrow screens. Tables own their horizontal overflow; the page itself remains naturally scrollable.

## Elevation & Depth

Surfaces are mostly flat. Depth comes from one-pixel borders and occasional offset shadows on the signature visual and product preview. Avoid glassmorphism and heavy ambient effects.

## Shapes

Controls and panels use small 5–7px radii. Pills are limited to status labels. Focus is a 2px orange outline with offset so keyboard navigation remains obvious.

## Components

Landing navigation, FAQ items, flow diagrams, product preview, dashboard navigation, organization cards, project cards, registry lists, forms, loading states, empty states, and inline errors are implemented as reusable components in `apps/web/components/`. Authenticated product screens use backend data and never substitute demo identities or metrics. Durable runtime values map directly from the frontmatter above to CSS custom properties in `globals.css`.

## Do's and Don'ts

- Do use orange for action and signal hierarchy.
- Do distinguish illustrative landing-page previews from authenticated product data.
- Do preserve visible borders and readable metadata at narrow widths.
- Don't imply API imports, dependency detection, authentication, or production analysis is operational.
- Don't add gradients, decorative illustrations, or speculative workflows that compete with the ecosystem map.
