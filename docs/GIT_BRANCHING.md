## Git Branch Strategy

We use a lightweight Gitflow:

- `main`: production-ready, protected. Only release PRs from `develop`.
- `develop`: integration branch for ongoing work.
- `feature/*`: feature branches off `develop`.
- `hotfix/*`: urgent fixes off `main`, merged back to both `main` and `develop`.

### Workflow
1) Branch from `develop`:
```
git checkout develop
git pull
git checkout -b feature/<short-name>
```
2) Commit early/often; keep changes scoped.
3) Open a PR into `develop` when ready. Ensure:
   - CI green
   - Reviewers assigned
   - Description includes context and testing notes
4) Squash merge to `develop`.
5) Release: open PR `develop` -> `main`, tag release after merge.

### Naming
- Features: `feature/login-form`
- Chores: `chore/update-deps`
- Fixes: `fix/web-redirect-loop`
- Hotfixes: `hotfix/crash-on-startup`

### Notes
- Rebase preferred over merge for clean history.
- Keep feature branches short-lived (<1 week when possible).
- Avoid force-pushing shared branches.


