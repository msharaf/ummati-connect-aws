## Local Development

### Prerequisites
- Node 18+
- pnpm 8+
- PostgreSQL (if running DB locally) and a valid `DATABASE_URL`

### Install
```
pnpm install
```

### Environment
Create a `.env` at repo root (and app-specific envs as needed):
```
DATABASE_URL="postgresql://user:pass@localhost:5432/ummati"
```

### Database
```
pnpm --filter @ummati/db prisma generate
pnpm --filter @ummati/db prisma migrate dev
```

### Start apps
```
pnpm dev:web      # Next.js web app
pnpm dev:mobile   # Expo mobile app
pnpm dev:api      # API server
```

### Useful
```
pnpm build        # Turbo build all
pnpm lint         # Turbo lint all
pnpm test         # Turbo test all
pnpm --filter @ummati/db prisma studio
```


