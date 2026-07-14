# Phase 1 setup — run these locally

1. Unzip this into a folder, e.g. `lms-frontend/`, `cd` into it.

2. Install dependencies:
   ```
   npm install
   ```

3. Copy the env file and point it at your backend:
   ```
   cp .env.example .env
   ```
   (already defaults to `http://localhost:8000/api/v1` — adjust the port if yours differs)

4. Init shadcn/ui (config is already in `components.json`, this just installs its deps):
   ```
   npx shadcn@latest init
   ```
   When prompted, it should detect the existing `components.json` — accept defaults / don't overwrite.

5. Run the dev server:
   ```
   npm run dev
   ```
   You should see the "Phase 1 complete" placeholder screen at `http://localhost:5173`.

## What's already wired up
- Vite + React + TS + Tailwind v4, `@` path alias → `src/`
- `src/api/axios.ts` — base instance, attaches JWT from the auth store, redirects to `/login` on 401
- `src/stores/authStore.ts` — Zustand store, persists token to localStorage, decodes role/userId from JWT
- `src/types/*` — TS interfaces for every schema you shared (auth, user, book, loan, stats)
- `src/api/*.api.ts` — one file per resource, every endpoint from your routers wired to a typed function

## Pagination (confirmed from the real service code)
`GET /books`, `GET /books/deleted`, `GET /loans/`, and `GET /user` all return a full
pagination envelope from their services — not a bare array:
```
{ data: [...], total, skip, limit, page, total_pages, has_next, has_previous }
```
`src/types/pagination.types.ts` has the generic type, `src/hooks/usePagination.ts` is a
ready-to-use page-based hook (next/prev/goToPage) built around it. No "load more"
guesswork needed — real page numbers and `has_next`/`has_previous` come straight
from the backend.

## Next (Phase 2 onward, once this runs cleanly)
- Protected routes + role guards
- OTP registration UI, login, password reset UI
- Dashboard shell + role-based nav
- Books, loans, users pages (using `usePagination`)
