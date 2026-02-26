# RMN Frontend

Next.js 14 (App Router, TypeScript). Ships with a starter dashboard that calls the .NET backend, SweetAlert2 helpers, and an OpenAPI type-generation script.

## Setup

- `npm install`
- Copy envs: `cp .env.local.example .env.local` and set `NEXT_PUBLIC_API_BASE_URL` (defaults to http://localhost:5280).

## Scripts

- `npm run dev` – start dev server at http://localhost:3000.
- `npm run lint` – lint.
- `npm run gen:types` – generate DTO typings from backend swagger (expects `http://localhost:5280/swagger/v1/swagger.json`; edit script if port changes). Run backend first.

## Structure highlights

- `src/lib/api/client.ts` – API client using shared base URL.
- `src/lib/ui/alerts.ts` – SweetAlert2 wrappers for quick toasts/modals.
- `src/types/generated.ts` – OpenAPI output target (checked in as a placeholder; regenerate after backend schema changes).
- `src/app/page.tsx` – dashboard template wired to health and RMN endpoints.
