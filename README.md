# Finance Track — backend

REST API for shared family or group income and expense tracking: users, JWT, refresh tokens, groups, categories, transactions, invitations.

**Related repository:** [finance-track-front](../finance-track-front) — Next.js client.

**Roadmap and backlog (product context):** [finance-track-front/docs/ROADMAP.md](../finance-track-front/docs/ROADMAP.md).

OpenAPI (Swagger) docs: after the server starts, open `http://localhost:<PORT>/api` (path configured in `src/main.ts`).

## Stack

- NestJS 10, TypeScript
- Prisma 6, PostgreSQL
- Passport JWT, cookie-parser, class-validator, class-transformer

## Requirements

- Node.js 20+
- PostgreSQL
- pnpm (recommended; commands below use pnpm)

## Setup and database

```bash
pnpm install
pnpm prisma generate
```

Apply migrations to your local database:

```bash
pnpm prisma migrate dev
```

Load seed data (if seeding is configured):

```bash
pnpm db:seed
```

Browse data in Prisma Studio:

```bash
pnpm studio
```

## Environment variables

Create a `.env` file in the backend root:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string (`prisma/schema.prisma`) |
| `CLIENT_URL` | Frontend origin for CORS (e.g. `http://localhost:3000`) |
| `JWT_SECRET_CODE` | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens |
| `PORT` | HTTP server port (optional; default **3000**) |

## Port and local pairing with the frontend

By default the API listens on **port 3000**, same as `next dev`. To run the frontend and API together, use for example:

- `PORT=3001`
- `CLIENT_URL=http://localhost:3000`

On the frontend, set `NEXT_API_BACKEND` and `NEXT_PUBLIC_API_BFF` to `http://localhost:3001` (or whichever port you chose).

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm run start:dev` | Development with watch mode |
| `pnpm run build` | Build |
| `pnpm run start:prod` | Run from `dist` (after `build`) |
| `pnpm run test` | Unit tests (Jest) |
| `pnpm run test:e2e` | E2E tests |
| `pnpm run test:cov` | Test coverage |
| `pnpm db:seed` | Prisma seed |
| `pnpm studio` | Prisma Studio |

## License

Private project (`UNLICENSED` in `package.json`).
