# F1 Dex Bot and Admin Panel

F1 Dex is an F1-themed Discord collection game with a race-control dashboard for managing drivers, players, drops, and bot operations.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server on the shared `/api` route
- `pnpm --filter @workspace/f1-dex-admin run dev` — run the web dashboard
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Admin UI: React + Vite + Tailwind CSS
- API: Express 5
- API contracts: OpenAPI + Orval-generated React Query hooks and Zod schemas
- Imported bot: Python `BallsDex-DiscordBot` v3 source under `ballsdex-bot/`

## Where things live

- `artifacts/f1-dex-admin/` — F1 Dex admin dashboard
- `artifacts/api-server/` — dashboard API routes and seeded F1 data
- `lib/api-spec/openapi.yaml` — source of truth for API contracts
- `ballsdex-bot/` — imported upstream Discord bot and its original Django admin panel
- `lib/api-client-react/src/generated/` — generated React Query client
- `lib/api-zod/src/generated/` — generated server validation schemas

## Architecture decisions

- The first dashboard pass is a separate React control room over the imported bot source, so the UI can be iterated without coupling the bot runtime to the TypeScript workspace.
- The API contract is defined in OpenAPI first; generated hooks are the only frontend API surface.
- The API currently uses an in-memory F1 seed store for a runnable preview; persistent database wiring can be added without changing the frontend contract.
- The upstream bot and original Django admin panel are kept intact under `ballsdex-bot/` for future runtime integration.

## Product

- Race-control dashboard with collection health, bot heartbeat, live activity, and weekend readiness
- Driver catalog with search, create, edit, activation, rarity, rating, and delete flows
- Player oversight with search, status filtering, collection totals, balances, and activity recency
- Activity timeline with type filters
- Bot operations for driver sync, drops, cache refresh, and pause/resume

## Gotchas

- If the OpenAPI file changes, run codegen before using new hooks or Zod schemas.
- The frontend and API are separate managed workflows and both must be running for live data.
- The imported upstream bot targets Python 3.14 and has its own dependency/runtime setup; it is source-imported but not launched by the TypeScript preview workflow yet.