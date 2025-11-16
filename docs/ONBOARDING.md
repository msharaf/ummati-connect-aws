## Engineer Onboarding

### Access
- Request access to GitHub repo, CI, and relevant cloud services.
- Ensure you have Node 18+, pnpm 8+, and PostgreSQL (local or remote).

### Setup
```
git clone <repo>
cd Ummati2.0
pnpm install
cp .env.example .env   # if provided; otherwise create .env per docs/LOCAL_DEV.md
```

### Database
```
pnpm --filter @ummati/db prisma generate
pnpm --filter @ummati/db prisma migrate dev
```

### Run Apps
```
pnpm dev:web
pnpm dev:mobile
pnpm dev:api
```

### Code Standards
- TypeScript strict mode.
- Use shared configs from `@ummati/config`.
- Follow module boundaries (no deep imports).
- Keep changes small and tested.

### PR Process
- Branch from `develop`.
- Open PRs targeting `develop`.
- CI must pass; request review from at least one maintainer.
- Squash and merge.

### Useful Commands
```
pnpm build
pnpm lint
pnpm test
pnpm --filter @ummati/db prisma studio
```


