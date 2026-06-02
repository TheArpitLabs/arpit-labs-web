# Arpit Labs UI Foundation

This repository contains reusable UI primitives and design-system components for the Arpit Labs frontend.

## Component Structure

- `src/components/layout`
  - `Container` — responsive page wrapper with max width and padding.
  - `SectionWrapper` — section layout with title, subtitle, optional badge, and consistent spacing.
  - `Navbar` — sticky, blurred navigation with mobile support and theme toggle.
  - `Footer` — Notion-inspired footer with brand area, navigation links, social actions, and newsletter placeholder.

- `src/components/ui`
  - `Button` — variants for primary, secondary, ghost, outline, icon, and loading state.
  - `Card` — base card plus specialized `FeatureCard`, `InfoCard`, and `BentoCard` layouts.
  - `Badge` — technology, status, category, outline, and secondary badge styling.
  - `SectionReveal` — reusable reveal animation wrapper for fade/slide entrance effects.

- `src/components/shared`
  - `FloatingIcon` — reusable animated floating icon card for AI, IoT, Hardware, Software, Cybersecurity.
  - `DottedPath` — SVG connector path with dotted stroke for visual flow.
  - `CTA` — call-to-action block with split layout and button actions.
  - `ThemeToggle` — accessible light/dark/system mode selector.

- `src/components/animations`
  - `AnimatedSection` — motion wrapper for fade-up entrance animation.

- `src/components/icons`
  - `iconMap` — centralized icon mapping for technology categories.

## Design Tokens

- `src/styles/tokens.css` contains all color tokens and spacing tokens.
- Tailwind configuration maps those tokens into utility classes with semantic naming.

## Theme Setup

- `next-themes` is configured in `src/app/layout.tsx`.
- Dark mode is supported through class-based theme variables and Tailwind `dark:` utilities.

## Usage

Import components directly from `@/components/...` or create new composition blocks using these primitives.

Example:

```tsx
import { SectionWrapper } from "@/components/layout/SectionWrapper";
import { FloatingIcon } from "@/components/shared/FloatingIcon";
```
