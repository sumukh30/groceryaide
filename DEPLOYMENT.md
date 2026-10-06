# GroceryAide Deployment Notes

## Production

- **Production branch:** `main`
- **Production URL:** https://groceryaide.sumukh-govinda666.workers.dev/
- **Source control:** GitHub
- **CI:** GitHub Actions
- **CD / hosting:** Cloudflare Workers Builds

## Normal release process

1. Synchronize local `main`:

   ```sh
   git switch main
   git pull --ff-only
   ```

2. Create a branch:

   ```sh
   git switch -c <branch-name>
   ```

3. Make the change.

4. Run local checks:

   ```sh
   npm run check
   ```

5. Review the working tree:

   ```sh
   git status
   git diff
   ```

6. Commit:

   ```sh
   git add .
   git commit -m "<type>: <message>"
   ```

7. Push:

   ```sh
   git push -u origin <branch-name>
   ```

8. Open a pull request into `main`.

9. Confirm the required GitHub Actions quality check passes.

10. Review the PR diff and merge.

11. Cloudflare automatically detects the updated `main` branch, runs the production build, and deploys the new version.

12. Smoke-test the public URL.

## CI failure encountered during v1

A GitHub Actions run exposed an asynchronous calendar test failure after the calendar had been lazy-loaded.

The application showed the lazy-loading fallback while the test was already trying to query a calendar date. The test was corrected to wait for the asynchronously rendered calendar UI while preserving the meaningful assertion.

Lesson:

- A clean CI runner can expose timing assumptions that are easy to miss during ordinary local development.
- The correct fix is to address the asynchronous test behavior, not disable or weaken the test.

## Deployment failure encountered during v1

A later feature branch passed the GitHub Actions CI quality checks and successfully completed the Vite production build in Cloudflare, but the Cloudflare branch-preview deployment failed during:

```sh
npx wrangler preview
```

The Cloudflare log reported that preview-specific Wrangler configuration was missing.

The preview failure was treated as a separate deployment-path issue. It did not invalidate the passing CI result or the already-tested production deployment path from `main`. The change was merged only after the required GitHub CI check passed, and the subsequent production deployment from `main` completed and was smoke-tested successfully.

Lesson:

```text
CI passed != deployment succeeded
```

Build/test failures and deployment/infrastructure failures are separate failure domains.

## Production smoke test

After deployment, verify:

- public URL loads
- hero video/fallback works
- add/edit groceries works
- past dates are rejected; today/future dates work
- Used and Discard update history correctly
- Used/Discarded badges are correct
- Delete uses the custom confirmation dialog
- search works
- shopping-list actions work
- reload preserves localStorage data
- JSON export/import works
- browser console/network show no unexpected failures

## Rollback

### Cloudflare rollback

Cloudflare Workers keeps version/deployment history. If a release is bad, select the last known-good Worker version from the Cloudflare dashboard and roll back the active deployment.

### Source-control rollback

Also create an auditable Git revert:

```sh
git switch main
git pull --ff-only
git switch -c fix/revert-<short-description>
git revert <commit-sha>
npm run check
git push -u origin fix/revert-<short-description>
```

Open a pull request, wait for the required CI check, merge, and verify the resulting Cloudflare production deployment.

A code rollback does **not** restore browser-local data. Exported JSON backups are the v1 user-data recovery mechanism.

## v1 architecture

```text
Browser
  |
  v
React + TypeScript + Vite
  |
  v
localStorage
```

There is no backend, shared database, server-side authentication, or server-side API in v1.

## Current CI/CD model

```text
Developer
   ↓
Feature/fix branch
   ↓
Local checks
   ↓
Push
   ↓
Pull request
   ↓
GitHub Actions CI
   ↓
Required status check
   ↓
Merge to protected main
   ↓
Cloudflare Workers Builds
   ↓
Production deployment
   ↓
Smoke test
```
