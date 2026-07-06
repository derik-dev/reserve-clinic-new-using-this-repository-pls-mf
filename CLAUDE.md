# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Next.js dev server (Turbopack, root pinned via `next.config.ts`).
- `npm run build` / `npm start` — production build and serve. Treat `npm run build` as the required validation before submitting (no test runner configured).
- `npm run lint` — `next lint` (no custom ESLint config yet).

## Stack

Next.js 16 App Router + React 19 + TypeScript (strict). Icons via `lucide-react`. Supabase JS client (`@supabase/supabase-js`) instantiated once in `src/lib/supabase.ts` from `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (see `.env.example`; `SUPABASE_SERVICE_ROLE_KEY` is server-only). Fonts (IBM Plex Sans, Space Grotesk) loaded through `next/font/google` in `src/app/layout.tsx` and exposed as `--font-plex` / `--font-space` CSS variables. Path alias `@/*` → `src/*`. UI language is Brazilian Portuguese (`lang="pt-BR"`). Default to React Server Components; add `"use client"` only when browser APIs, event handlers, or state are needed.

## Architecture

The app is a clinic-management SaaS with three surface areas that share the same root layout but split by route group:

1. **Marketing / public / onboarding** — `src/app/page.tsx` (landing), `src/app/login/page.tsx`, `src/app/registro/page.tsx` (signup), `src/app/onboarding/page.tsx` (post-signup clinic setup), `src/app/agendamento/page.tsx` (public patient booking link). These render without the app shell.
2. **Authenticated product** — everything under the `src/app/(system)/` route group (`dashboard`, `agenda`, `consultas`, `pacientes`). The group's `layout.tsx` wraps children in `AppShell`, which owns the sidebar navigation, topbar, clinic switcher, and mobile drawer state. Add new product pages inside `(system)/` so they inherit the shell.
3. **Design reference** — `design-lp/Clinicare - Landing Page.html` is the source-of-truth HTML mockup that the landing page (`src/app/page.tsx`) mirrors. The `*-full.png` / `*-viewport.png` files at the repo root are before/after screenshots used when iterating on that page.

### API routes

`src/app/api/extract-colors/route.ts` — server-only handler that posts a logo (base64 or URL) to Groq's chat-completions endpoint (`meta-llama/llama-4-scout-17b-16e-instruct`) and returns `{ primary, secondary }` hex colors. Requires `GROQ_API_KEY`; consumed by the onboarding flow to derive brand colors from an uploaded logo.

### Styling

No CSS modules, no Tailwind. All styles live as flat CSS files under `src/app/` and are imported globally in `src/app/layout.tsx` (`globals.css`, `product.css`, `product-tables.css`, `login.css`, `booking.css`, `onboarding.css`). Class names are camelCase (e.g. `appShell`, `pageHeader`, `clinicSwitcher`) and are shared across pages — when adding UI, prefer extending an existing CSS file over creating a new stylesheet, and remember to import any new stylesheet in the root layout. Formatting conventions (per `AGENTS.md`): two-space indent, semicolons, double quotes, PascalCase components, lowercase route segments.

### Navigation contract

`src/components/AppShell.tsx` hard-codes the sidebar `navigation` array. Adding a route under `(system)/` requires appending an entry there for it to appear in the sidebar; active-state highlighting is a strict `pathname === href` match.
