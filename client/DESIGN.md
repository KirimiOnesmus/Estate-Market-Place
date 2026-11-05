---
version: alpha
colors:
  primary: "#244A3B"
  background: "#F4F6F8"
  surface: "#FFFFFF"
  foreground: "#1F2937"
  muted: "#667085"
  border: "#E2E7EC"
typography:
  sans:
    fontFamily: "Inter, Helvetica Neue, Helvetica, Arial, sans-serif"
  display:
    fontFamily: "Linux Libertine, Georgia, Times New Roman, serif"
rounded:
  control: "9px"
  card: "12px"
spacing:
  base: "4px"
  section: "28px"
components:
  primaryButton:
    radius: "9px"
    background: "#244A3B"
    foreground: "#FFFFFF"
  surfaceCard:
    radius: "12px"
    border: "#E2E7EC"
omitted:
  - section: elevation
    reason: "Use flat surfaces; reserve a low-contrast shadow for dialogs and temporary layers."
---

## Overview

Pavilion Court is a practical resident product for neighbours in Membley Estate. Its visual tone is modern, professional, and calm. Keep the interface information-led: clear page titles, readable values, compact navigation, and consistent status treatment. Avoid marketing-site styling, ornamental campaign artwork, excessive cards, and decorative gradients.

## Colors

Tailwind CSS v4 variables in `src/index.css` are the runtime source of truth. Cool stone and white carry the majority of the interface; forest green identifies primary actions and community state. Blue and amber are reserved for informational and caution statuses. Dark mode uses charcoal surfaces while preserving semantic status colors.

## Typography

Use an Inter, Helvetica Neue, Helvetica, Arial, sans-serif system stack for body text and controls. Use Linux Libertine, Georgia, Times New Roman, serif for semantic page and section headings. Standard body text is 16px, with compact utility labels allowed where their role is clear. Keep the Appearance panel's Standard, Wide, and color mode choices consistent across roles; defaults are Standard text, Standard width, and Light mode.

## Layout

Use a persistent desktop navigation rail, a compact mobile bottom navigation, and one bounded content column. Organize each role's work around that role's own pages and actions. Use dividers, whitespace, and type hierarchy for structure. Avoid large decorative graphics; use compact icons only when they help identify an action or status.

Creation flows use full-page forms that take the available content width, with a short contextual panel when useful. Keep dialogs for decisions and confirmations.

Dense data responds to its own container. The issue report list becomes a semantic table at wide widths and labeled stacked rows at narrower widths. Mobile rows preserve the title and status and reveal location and the latest update inline.

## Elevation & Depth

Surfaces are flat, with fine borders. A restrained shadow is appropriate for dialogs and temporary decision layers. Do not use gradients or decorative image treatments in the resident product.

## Shapes

Use 9px controls and 12px cards. Status labels have a modest radius and readable text. Avoid oversized pill controls and deeply nested cards.

## Components

`src/app` owns the application shell and role navigation. `src/features/resident`, `src/features/admin`, `src/features/committee`, and `src/features/super-admin` own role-specific pages and components. Super Admin handles platform operations and technical support without estate decision controls. `src/shared/components` owns repeated behavior and presentation. Use Tailwind utilities for layout and the Feather set from `react-icons/fi` for interface icons.

## Do's and Don'ts

- Do make role-specific work easy to distinguish while keeping a shared application frame.
- Do pair status color with text and preserve keyboard focus and touch targets.
- Do use real labels, inline validation, and native modal dialog behavior.
- Do respect system, light, and dark theme preferences and reduced motion.
- Don't use emoji, Lucide icons, linear gradients, or filler illustrations in the interface.
- Don't imply sample data or local preview actions are connected to live accounts or payments.
