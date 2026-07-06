# Repository Guidelines

## Project Structure & Module Organization

This repository is a Next.js 16 application using the App Router and TypeScript.

- `src/app/`: routes, layouts, and global styles.
- `src/app/(system)/`: authenticated product screens sharing the internal application layout.
- `src/app/login/` and `src/app/agendamento/`: standalone public flows.
- `src/components/`: reusable UI components such as `AppShell`, `PageHeader`, and `StatusBadge`.
- `design-lp/`: original landing-page design reference. Treat it as reference material, not runtime code.
- Root configuration: `next.config.ts`, `tsconfig.json`, and `package.json`.

Place route-specific UI beside its `page.tsx`. Move UI reused by multiple routes into `src/components/`.

## Build, Test, and Development Commands

Install dependencies before the first run:

```bash
npm install
npm run dev
```

- `npm run dev`: starts the Turbopack development server, normally at `http://localhost:3000`.
- `npm run build`: creates an optimized production build and runs TypeScript validation.
- `npm run start`: serves the completed production build.

There is currently no automated test command. Use `npm run build` as the required technical validation before submitting changes.

## Coding Style & Naming Conventions

Use TypeScript and React Server Components by default. Add `"use client"` only when browser APIs, event handlers, or React state are required.

- Use two-space indentation, semicolons, and double quotes.
- Name React components in PascalCase: `StatusBadge.tsx`.
- Name route folders with lowercase URL segments: `src/app/agendamento/`.
- Prefer named exports for reusable components and default exports for route pages.
- Use `next/link` for internal navigation and Lucide icons for interface icons.
- Keep shared styles in the existing CSS files; reuse current color and spacing patterns.

## Testing Guidelines

No test framework or coverage requirement is configured yet. When adding tests, colocate them as `Component.test.tsx` or place integration tests under `tests/`. Verify responsive behavior, keyboard-accessible controls, and all affected routes.

## Commit & Pull Request Guidelines

The repository has no Git history establishing a commit convention. Use short, imperative messages such as `Add patient search filters`.

Pull requests should include a concise summary, affected routes, validation performed, and screenshots for visual changes. Link relevant issues and call out new dependencies or configuration changes.

## Security & Configuration

Never commit secrets, credentials, or local environment files. Keep environment-specific values in `.env.local` and document required variable names without including their values.
