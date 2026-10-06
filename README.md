# GroceryAide

A local-first grocery inventory, date-reminder dashboard, and shopping list built with React, TypeScript, Vite, Tailwind CSS, and Vitest. No account, backend, cloud database, paid service, AI API, or application telemetry. Runtime dependencies are React, React DOM, and the MIT-licensed `@daypicker/react` calendar; all application dependencies are free and open source.

**Date reminders are not food-safety determinations.** A reminder uses a date you enter; it does not establish whether food is safe or unsafe to eat. This MVP shows reminders while the application is open and does not send background notifications.

## Live application

Production: https://groceryaide.sumukh-govinda666.workers.dev/

## Run locally

Use Node.js 24 (see `.nvmrc`) and npm. If you use nvm, run `nvm use` first.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. No environment variables or secrets are required.

| Command              | Purpose                                           |
| -------------------- | ------------------------------------------------- |
| `npm run dev`        | Development server with live updates              |
| `npm test`           | Run the automated tests once                      |
| `npm run test:watch` | Rerun tests while editing                         |
| `npm run lint`       | Run the configured Oxlint checks                  |
| `npm run build`      | Type-check and create production files in `dist/` |
| `npm run preview`    | Serve the existing production build locally       |
| `npm run check`      | Lint, tests, and production build in sequence     |

`preview` is for local verification, not a production server. Use HTTPS for a public deployment.

## Features and behavior

- Add, edit, search, and delete groceries with name, category, quantity, and reminder date.
- Reminder dates must be today or later. **Check today:** today; **Coming up:** the next three calendar days; **For later:** four or more days away. Items sort by date, then name.
- Reminders use your device's local date, refreshed every 30 seconds and when the window regains focus. Calendar arithmetic avoids daylight-saving-time shifts.
- Mark groceries used or discarded; restore them from history. Summary counts represent **entries**, not summed quantities or servings. Deleting an entry also removes it from counts.
- Search names and categories in both inventory and expanded history.
- Add/remove shopping items; reject blank or duplicate shopping names (case-insensitive).
- Download and import versioned JSON backups. An import is validated in full and previewed before you explicitly replace current inventory, history, and shopping data.
- Responsive layout, visible keyboard focus, labelled form inputs, an accessible category listbox and calendar, skip link, status announcements, and clear empty/error states. Permanent deletion uses a GroceryAide confirmation dialog instead of the browser confirmation UI.

Quantity is an integer from 1 through 999; names are trimmed and limited to 100 characters. Dates must be real calendar dates in `YYYY-MM-DD` format and cannot be earlier than the device's current local date. Each list is limited to 5,000 entries, and backups to 2 MB. This is intended for household-sized inventories.

## Architecture

| File                               | Responsibility                                                           |
| ---------------------------------- | ------------------------------------------------------------------------ |
| `src/domain/inventory.ts`          | Types, validation, immutable CRUD operations, summaries, date grouping   |
| `src/domain/storage.ts`            | Versioned schema validation, JSON import/export, localStorage adapter    |
| `src/hooks/useInventory.ts`        | React state, persistence status, storage errors and stale-tab protection |
| `src/components/ItemForm.tsx`      | Accessible add/edit form                                                 |
| `src/components/ItemCard.tsx`      | Grocery details and actions                                              |
| `src/components/ConfirmDialog.tsx` | Accessible confirmation dialog for permanent deletion                    |
| `src/App.tsx`                      | Dashboard, shopping list, history and backup workflow                    |
| `src/index.css`                    | Tailwind import, responsive layout and visual styles                     |
| `src/domain/*.test.ts`             | Domain and persistence tests                                             |
| `src/App.test.tsx`                 | User interaction and recovery tests with Testing Library/jsdom           |
| `.github/workflows/ci.yml`         | Install, lint, test, build, and upload build artifact                    |
| `public/_headers`                  | Custom security headers for Cloudflare-served static assets              |

Domain code has no React dependency. Untrusted backup data is parsed as `unknown`, checked field by field, and reconstructed from allowed fields. No imported content is interpreted as HTML. Schema version 1 is shared by browser persistence and downloadable backups; unsupported versions are rejected rather than guessed. Add explicit migrations and compatibility tests before changing that schema.

## UI design and hero media

The UI uses cream surfaces, natural greens, warm orange accents, system fonts, and a Georgia hero heading. Theme colors, shadows, radii, spacing steps, and transition timing live in `src/index.css`; calendar overrides use those same tokens. There are no remote fonts, stock-media downloads, animation libraries, or icon packages. The original decorative `public/media/kitchen-poster.svg` is approximately 2.5 KB and requires no attribution. Its palette is self-contained because it is an image asset.

UI components:

| File                                                        | Responsibility                                                             |
| ----------------------------------------------------------- | -------------------------------------------------------------------------- |
| `src/components/StatusBadge.tsx`                            | Explicit Used/Discarded history labels and decorative icons                |
| `src/components/HeroBackdrop.tsx`                           | Static fallback and deferred hero video with motion/data-saving safeguards |
| `src/components/CategorySelect.tsx`                         | Animated listbox, arrow/Home/End keys, first-letter navigation             |
| `src/components/DateField.tsx`                              | Labelled date text input, popup and deferred calendar                      |
| `src/components/Calendar.tsx`, `Calendar.css`               | Themed DayPicker and local calendar-date conversion                        |
| `src/hooks/useReducedMotion.ts`                             | Live reduced-motion preference for calendar animation                      |
| `src/hooks/useDisclosure.ts`                                | Outside click, Escape, focus restoration, inert exit animation             |
| `src/components/LoadBoundary.tsx`                           | Local recovery message if an optional chunk cannot load                    |
| `src/components/Controls.test.tsx`, `HeroBackdrop.test.tsx` | Keyboard, date and media behavior tests                                    |

### Summary colors and interaction language

Summary variants use named classes rather than their position in a list. In your kitchen has dark neutral text on a light surface; Check today retains warm cream/yellow; Used has a solid GroceryAide green surface with white heading, count and supporting text; Discarded uses warm orange-brown heading/count and a tinted border. Every tile retains its label and count.

`StatusBadge` renders **Used** (green/white with a check) or **Discarded** (orange-brown/white with a bin) in history. Icons are decorative; text is always visible. **Discard** updates status and keeps the record in history. **Delete** opens the custom confirmation dialog and removes the record entirely only after confirmation. Persistence/schema logic is unchanged.

Theme additions include dark neutral text, an orange border, white-on-accent text, green focus/shadow tokens, a shared 46 px control height, and restrained elevation shadows. Motion uses 200 ms and `cubic-bezier(0.2, 0.8, 0.2, 1)`. True hover styles require both `(hover: hover)` and `(pointer: fine)`; summary/item cards lift 2 px, the Used tile deepens in green, and the hero action gains a stronger shadow. Cards stay non-clickable with the default cursor. Touch users retain pressed states and keyboard users retain green focus rings. Reduced motion removes translations, not just transition duration.

### Hero video

The application uses the supplied **`public/media/groceryaide_backgrnd.mp4`**, referenced through `import.meta.env.BASE_URL` in `src/App.tsx`. Vite copies it unchanged to `dist/media/groceryaide_backgrnd.mp4`. The current file is 1,902,490 bytes (1.90 MB), 1280×720, approximately 10 seconds, with H.264 video and fast-start metadata before the media payload. It includes an audio track, but playback is always muted and there is no unmute control. No media download or encoding dependency is needed to build the app.

The existing `public/media/kitchen-poster.svg` renders immediately and remains beneath the video. The video loads after a 1.2-second delay only when the hero is visible and motion/data-saving preferences allow it. Playback uses `autoPlay`, `muted`, `loop`, `playsInline`, and `preload="none"`; autoplay still causes media transfer. No native controls are displayed. An accessible separate Pause/Play background button lets users stop decorative motion.

Video fades in only after the browser reports playback. Loading/decoding errors and blocked autoplay retain the illustration. Interrupted play requests caused by pausing or visibility changes do not permanently disable playback. Playback pauses when offscreen or when the tab is hidden. Reduced-motion users get the static illustration with no video request, including when the preference changes while the page is open. Data Saver, slow 2G, or missing browser observation APIs also retain the fallback.

The video occupies the right 58% with `object-fit: cover`, rounded clipping, and a cream gradient protecting text. Mobile layouts reserve a separate bottom area for the pause button so it cannot cover Add grocery. Hero dimensions are reserved before media loading.

### Calendar and popup behavior

The [DayPicker single-selection API](https://daypicker.dev/start) supplies accessible day labels, arrow-key navigation, today/selected states and previous/next month controls. The calendar and its stylesheet load only on first opening; the editable date field works without them. Input remains `YYYY-MM-DD`. Past dates are disabled in the calendar and rejected by application validation; today and future dates are allowed. Date-only values use local calendar semantics rather than UTC serialization, avoiding timezone offsets shifting the selected day.

Popups animate opacity/translation for 200 ms. Closing immediately makes the retained exit frame inert and hidden from assistive technology. Escape and selection return focus to the trigger; outside clicks and Tab dismiss without trapping focus. The calendar is a nonmodal dialog. The grocery editor remains an inline section, supports Escape, and returns focus to its opening Add/Edit button.

### Bundle and responsive review

`React.lazy` and local `Suspense` placeholders split the editor and, separately, the calendar. Local error boundaries preserve the rest of the dashboard if a chunk fails. The backup/history UI and cards are small and remain eager; history content renders only when expanded. No below-the-fold images are currently rendered. The hero image is intentionally eager, with intrinsic dimensions and reserved hero height. No domain or localStorage schema changes were made.

The production build is approximately 76 KB gzip for initial JavaScript (baseline 75 KB), 2.4 KB for the deferred editor, 20 KB for the deferred calendar, 6.5 KB initial CSS and 1.9 KB deferred calendar CSS. Hashed filenames and exact sizes vary. Network checks confirm optional chunks are absent initially, and the MP4 loads separately after the hero delay. Reduced motion makes no video request.

Chrome production checks cover 375, 768, 1280 and 1600 px, with an additional 320 px overflow check. Summary cards use two/four columns; inventory cards and the shopping/backup sidebar reflow for smaller widths. Long names wrap, popup widths stay inside the viewport, and controls have visible focus states. The calendar scrolls vertically in short viewports and its day columns shrink at 320 px without horizontal scrolling. Calendar day targets are compact (approximately 32–38 px wide) to fit seven columns on narrow phones; main action buttons are at least 44 px tall. Noninteractive cards do not show a pointer cursor.

Before deployment, manually check Safari/iOS and Firefox, touch interaction, keyboard-only operation, screen-reader announcements, 200% zoom, reduced motion, and calendar usability with the mobile keyboard open. Repeat grocery add/edit/use/discard/restore/delete, search, shopping actions, reload persistence, and JSON backup import/export on the final origin. Verify the video's pause control, failure fallback, reduced-motion behavior and Network transfer size on the final deployment. Automated component tests cover blocked autoplay and media failures; cross-browser screen-reader certification is not included.

## Storage, privacy, and backup limitations

Data is stored locally in the user's browser for this initial release. It does not sync across devices and can be lost if browser storage is cleared.

The localStorage key is `groceryaide.inventory`. Data stays in this browser profile on this exact origin (scheme, hostname, and port). There is no sync between devices, browsers, localhost, preview deployments, and the production domain. Export from the old origin and import on the new one when moving.

Clearing site data, deleting a browser profile, private browsing, or browser storage eviction can lose the inventory. Data and downloaded backups are not encrypted; other people using this browser profile can access them. Keep backups somewhere appropriate for your device.

Malformed saved data is preserved and editing is blocked until you export the original for recovery and explicitly start fresh or import a valid backup. A failed write keeps changes in memory and shows an actionable warning: export before closing the tab, or retry saving. The app never promises a save succeeded when it failed.

Use one editing tab. Storage events and a pre-write comparison detect stale tabs and stop further edits until reloading. This is best-effort protection: localStorage does not provide cross-tab transactions, so truly simultaneous writes can still race. Export in-memory changes before reloading a stale tab.

The app works without API calls once loaded, but **offline reload is not guaranteed**: there is no service worker or installable PWA in this MVP. There is no automatic remote error reporting. Hosting providers still receive normal requests for application files.

## Release verification

The v1 release is validated through the project's `npm run check` command, which runs linting, automated tests, and the production build. The same quality checks run in GitHub Actions on pushes and pull requests. The public deployment was also smoke-tested after Cloudflare deployed the current `main` branch.

Manual release checks cover the hero video and fallback behavior, responsive layout, grocery add/edit/use/discard/delete flows, custom delete confirmation, prevention of past reminder dates, search, shopping-list behavior, history badges, localStorage persistence, and JSON export/import.

## Verify milestones

1. **Domain:** `npm test -- src/domain`. This checks date boundaries (including leap years and DST), validation, CRUD, summary counts, shopping operations, malformed saved data, duplicate IDs, size limits, and backup round trips.
2. **UI:** `npm test -- src/App.test.tsx`, then `npm run dev`. Verify that yesterday is rejected while today and future dates are accepted. Check grouping; edit, search, use, discard, restore, and delete through the custom confirmation dialog. Add/remove shopping entries. Reload to check persistence.
3. **Recovery:** Export a backup, change your inventory, import the backup, inspect the preview, cancel once, then confirm. Try an invalid JSON file and verify the current inventory survives. Automated tests also simulate storage write failures and a stale tab.
4. **Release:** `npm run check`, then `npm run preview`. Repeat the main flow against the production build. At mobile width (320–390 px), verify there is no horizontal scrolling, and use Tab/Shift+Tab/Enter to reach controls. Check actual downloads and file selection in your browser; jsdom does not verify native dialogs, layout, or real browser storage policy.

For a corrupt-storage drill, use a disposable browser profile or export first. In browser DevTools → Application → Local Storage, set `groceryaide.inventory` to invalid JSON and reload. Confirm the recovery warning appears and the raw value remains intact. Export the original, then restore a valid backup. Do not run destructive storage experiments on your only copy.

## Git and pull-request workflow

`main` is the production branch and is protected by repository rules. Application changes should be made on a feature/fix branch and merged through a pull request.

Typical workflow:

```sh
git switch main
git pull --ff-only
git switch -c <branch-name>

# make and verify changes
npm run check

git status
git diff
git add .
git commit -m "<type>: <message>"
git push -u origin <branch-name>
```

Open a pull request into `main`, review the diff, and wait for the required GitHub Actions quality check to pass before merging. Required status checks act as a merge gate on the protected branch.

After a pull request is merged, synchronize the local production branch:

```sh
git switch main
git pull --ff-only
```

`--ff-only` is used as a guardrail: local `main` is expected to move forward to the GitHub `main` history without creating an unexpected merge commit.

## CI/CD and production deployment

### Continuous Integration

GitHub Actions runs the repository's quality workflow on pushes and pull requests. The workflow installs dependencies and executes the project's automated quality checks, including linting, tests, and a production build.

The `main` branch is protected so the required quality check must pass before a pull request is merged. GitHub supports required status checks specifically to prevent changes from entering a protected branch until the selected checks have completed successfully.

### Continuous Deployment

GroceryAide is connected to Cloudflare Workers Builds through the Git repository.

Production branch: `main`

Production URL:

https://groceryaide.sumukh-govinda666.workers.dev/

When a commit reaches `main`, Cloudflare automatically starts the production build. The configured build command compiles the Vite application, and the production deploy step publishes the new version to the existing Worker. No manual upload of `dist/` is required for the normal release path.

Cloudflare Workers Builds treats the production branch separately from preview branches. The v1 release depends on the tested production path from `main`; branch-preview deployment is not a required merge gate for v1.

### Production release flow

```text
Local development
        ↓
Feature/fix branch
        ↓
Local quality checks
        ↓
Commit and push
        ↓
Pull request into main
        ↓
GitHub Actions CI
        ↓
Required status check passes
        ↓
Merge into protected main
        ↓
Cloudflare detects the new main commit
        ↓
Production build
        ↓
Automatic deployment
        ↓
Production smoke test
```

### Production smoke test

After a production deployment, verify:

1. The public GroceryAide URL loads successfully.
2. The hero video loads and its fallback still works.
3. Add and edit grocery flows work.
4. Past reminder dates cannot be selected or saved; today and future dates are accepted.
5. Used and Discard actions move entries to history with the correct status badges.
6. Delete opens the custom confirmation dialog and permanently removes the item only after confirmation.
7. Search and shopping-list actions work.
8. Reloading preserves browser-local data.
9. JSON export/import still works.
10. DevTools Console and Network do not show unexpected application or asset-loading failures.

## Monitoring and recovery

GroceryAide v1 does not include Sentry, server-side metrics, automatic uptime alerts, or a backend observability stack. Release monitoring is currently based on GitHub Actions results, Cloudflare build/deployment status, browser DevTools, and the manual production smoke test.

For a bad application release:

1. Preserve browser data first by exporting a backup if possible.
2. Identify the last known-good Cloudflare Worker deployment.
3. Cloudflare Workers can roll back to a previously deployed Worker version from the dashboard.
4. Also revert the faulty Git commit through a normal branch and pull request:

```sh
git switch main
git pull --ff-only
git switch -c fix/revert-<short-description>
git revert <commit-sha>
npm run check
git push -u origin fix/revert-<short-description>
```

5. Let the required CI check pass, merge the revert, and verify the automatic production deployment.
6. Run the smoke test again.

A code rollback does not restore deleted browser-local data. GroceryAide v1 has no server-side database; recovery of user data depends on browser storage and exported JSON backups.

## Known v1 limitations

- Data is stored only in the current browser/profile and does not sync across devices.
- There is no user authentication or account system.
- There is no backend API or shared database.
- There is no server-side analytics, tracing, Sentry integration, or automatic uptime monitoring.
- There is no service worker or installable PWA, so offline reload is not guaranteed.
- Cloudflare branch-preview deployment is not part of the required v1 release path.
- Load testing is intentionally deferred until a backend/API exists.

## Planned v2 direction

A future version can introduce a FastAPI backend, PostgreSQL, database migrations, authentication, containerization, server-side error tracking and structured logging, health/readiness endpoints, and API load testing. These are intentionally outside the v1 scope so that v1 remains a complete frontend shipping and CI/CD milestone.
