# GroceryAide

A local-first grocery inventory, date-reminder dashboard, and shopping list built with React, TypeScript, Vite, Tailwind CSS, and Vitest. No account, backend, cloud database, paid service, AI API, or application telemetry. Runtime dependencies are React, React DOM, and the MIT-licensed `@daypicker/react` calendar; all application dependencies are free and open source.

**Date reminders are not food-safety determinations.** A reminder uses a date you enter; it does not establish whether food is safe or unsafe to eat. This MVP shows reminders while the application is open and does not send background notifications.

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
- **Check today:** today or earlier; **Coming up:** the next three calendar days; **For later:** four or more days away. Items sort by date, then name.
- Reminders use your device's local date, refreshed every 30 seconds and when the window regains focus. Calendar arithmetic avoids daylight-saving-time shifts.
- Mark groceries used or discarded; restore them from history. Summary counts represent **entries**, not summed quantities or servings. Deleting an entry also removes it from counts.
- Search names and categories in both inventory and expanded history.
- Add/remove shopping items; reject blank or duplicate shopping names (case-insensitive).
- Download and import versioned JSON backups. An import is validated in full and previewed before you explicitly replace current inventory, history, and shopping data.
- Responsive layout, visible keyboard focus, labelled form inputs, an accessible category listbox and calendar, skip link, status announcements, and clear empty/error states. Destructive deletion uses the browser's confirmation dialog.

Quantity is an integer from 1 through 999; names are trimmed and limited to 100 characters. Dates must be real calendar dates in `YYYY-MM-DD` format (years 0001–9999); past dates are allowed. Each list is limited to 5,000 entries, and backups to 2 MB. This is intended for household-sized inventories.

## Architecture

| File                          | Responsibility                                                           |
| ----------------------------- | ------------------------------------------------------------------------ |
| `src/domain/inventory.ts`     | Types, validation, immutable CRUD operations, summaries, date grouping   |
| `src/domain/storage.ts`       | Versioned schema validation, JSON import/export, localStorage adapter    |
| `src/hooks/useInventory.ts`   | React state, persistence status, storage errors and stale-tab protection |
| `src/components/ItemForm.tsx` | Accessible add/edit form                                                 |
| `src/components/ItemCard.tsx` | Grocery details and actions                                              |
| `src/App.tsx`                 | Dashboard, shopping list, history and backup workflow                    |
| `src/index.css`               | Tailwind import, responsive layout and visual styles                     |
| `src/domain/*.test.ts`        | Domain and persistence tests                                             |
| `src/App.test.tsx`            | User interaction and recovery tests with Testing Library/jsdom           |
| `.github/workflows/ci.yml`    | Install, lint, test, build, and upload build artifact                    |
| `public/_headers`             | Cloudflare Pages security headers                                        |

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

`StatusBadge` renders **Used** (green/white with a check) or **Discarded** (orange-brown/white with a bin) in history. Icons are decorative; text is always visible. **Discard** updates status and keeps the record in history. **Delete** uses the existing confirmation and removes the record entirely. Persistence/schema logic is unchanged.

Theme additions include dark neutral text, an orange border, white-on-accent text, green focus/shadow tokens, a shared 46 px control height, and restrained elevation shadows. Motion uses 200 ms and `cubic-bezier(0.2, 0.8, 0.2, 1)`. True hover styles require both `(hover: hover)` and `(pointer: fine)`; summary/item cards lift 2 px, the Used tile deepens in green, and the hero action gains a stronger shadow. Cards stay non-clickable with the default cursor. Touch users retain pressed states and keyboard users retain green focus rings. Reduced motion removes translations, not just transition duration.

### Hero video

The application uses the supplied **`public/media/groceryaide_backgrnd.mp4`**, referenced through `import.meta.env.BASE_URL` in `src/App.tsx`. Vite copies it unchanged to `dist/media/groceryaide_backgrnd.mp4`. The current file is 1,902,490 bytes (1.90 MB), 1280×720, approximately 10 seconds, with H.264 video and fast-start metadata before the media payload. It includes an audio track, but playback is always muted and there is no unmute control. No media download or encoding dependency is needed to build the app.

The existing `public/media/kitchen-poster.svg` renders immediately and remains beneath the video. The video loads after a 1.2-second delay only when the hero is visible and motion/data-saving preferences allow it. Playback uses `autoPlay`, `muted`, `loop`, `playsInline`, and `preload="none"`; autoplay still causes media transfer. No native controls are displayed. An accessible separate Pause/Play background button lets users stop decorative motion.

Video fades in only after the browser reports playback. Loading/decoding errors and blocked autoplay retain the illustration. Interrupted play requests caused by pausing or visibility changes do not permanently disable playback. Playback pauses when offscreen or when the tab is hidden. Reduced-motion users get the static illustration with no video request, including when the preference changes while the page is open. Data Saver, slow 2G, or missing browser observation APIs also retain the fallback.

The video occupies the right 58% with `object-fit: cover`, rounded clipping, and a cream gradient protecting text. Mobile layouts reserve a separate bottom area for the pause button so it cannot cover Add grocery. Hero dimensions are reserved before media loading.

### Calendar and popup behavior

The [DayPicker single-selection API](https://daypicker.dev/start) supplies accessible day labels, arrow-key navigation, today/selected states and previous/next month controls. The calendar and its stylesheet load only on first opening; the editable date field works without them. Input remains `YYYY-MM-DD` with the original year range 0001–9999. Date-only values are parsed at local noon and serialized with local year/month/day getters, never `toISOString()`, avoiding UTC offsets shifting the selected day. Invalid dates stay visible and are rejected by the unchanged domain validator.

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

The frontend release was verified with `npm run lint`, `npm test` (71 passing tests in six files), `npm run build`, and `npm run preview`. Headless Chrome against the production build confirmed actual MP4 playback at 320, 375, 768, 1280, and 1600 px, no page overflow, deferred editor/calendar chunks, popup bounds and initial focus, pause/resume, offscreen pause, reduced-motion suppression, and blocked-media fallback. No runtime exceptions were reported. Hero height stayed unchanged before/after playback, and mobile Add/Pause controls did not overlap. The supplied MP4 and built copy have identical SHA-256 hashes.

Core text/background pairs were checked numerically: Used white/green 8.10:1, Discarded badge white/orange-brown 5.98:1, Discarded tile 5.92:1, and muted text on light green 4.84:1. These checks do not replace the manual browser/device checklist below.

## Verify milestones

1. **Domain:** `npm test -- src/domain`. This checks date boundaries (including leap years and DST), validation, CRUD, summary counts, shopping operations, malformed saved data, duplicate IDs, size limits, and backup round trips.
2. **UI:** `npm test -- src/App.test.tsx`, then `npm run dev`. Add groceries dated yesterday, today, three days ahead, and four days ahead. Check grouping; edit, search, use, discard, restore, and delete. Add/remove shopping entries. Reload to check persistence.
3. **Recovery:** Export a backup, change your inventory, import the backup, inspect the preview, cancel once, then confirm. Try an invalid JSON file and verify the current inventory survives. Automated tests also simulate storage write failures and a stale tab.
4. **Release:** `npm run check`, then `npm run preview`. Repeat the main flow against the production build. At mobile width (320–390 px), verify there is no horizontal scrolling, and use Tab/Shift+Tab/Enter to reach controls. Check actual downloads and file selection in your browser; jsdom does not verify native dialogs, layout, or real browser storage policy.

For a corrupt-storage drill, use a disposable browser profile or export first. In browser DevTools → Application → Local Storage, set `groceryaide.inventory` to invalid JSON and reload. Confirm the recovery warning appears and the raw value remains intact. Export the original, then restore a valid backup. Do not run destructive storage experiments on your only copy.

## Upload to GitHub

This repository already has Git initialized. Upload the source, lockfile, configuration, tests, and public media together; uploading only this README will not publish a runnable project. The commands below are manual steps and do not deploy the website.

```sh
git status --short
git diff
# Optional: start a branch before your first commit.
git switch -c feat/groceryaide-mvp
```

Stage known application paths rather than blindly including personal files (the existing `Notes.txt` is not part of the app):

```sh
git add src index.html package.json package-lock.json vite.config.ts tsconfig.app.json
git add README.md .gitignore .nvmrc .github/workflows/ci.yml public
git diff --cached
npm run check
git commit -m "feat: build local-first GroceryAide MVP"
git log --oneline -5
```

Create an empty repository in your GitHub account. Leave the initial README, license, and .gitignore options unchecked because this project already has local history and files. Then run:

```sh
git remote -v
# Only if no origin exists: replace YOUR_USERNAME and YOUR_REPOSITORY.
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin HEAD
```

If `origin` already exists, verify its destination and skip `git remote add`. The push publishes your current branch; select that branch on GitHub to see the files. If you used the optional feature branch above, merge it into your chosen default branch when ready. Authenticate through Git's credential manager or SSH; do not put access tokens in files or remote URLs.

Confirm that GitHub displays the README, `src/`, `public/media/groceryaide_backgrnd.mp4`, `package-lock.json`, and `.github/workflows/ci.yml`. Check the **Quality checks** workflow result after pushing. `node_modules/`, `dist/`, environment files, and personal `Notes.txt` are ignored. Uploading to GitHub does not by itself deploy the app; the included workflow checks and builds only.

For future changes, run `npm run check`, review the diff, commit, and push. Keep unrelated changes separate.

## Static release commands

```sh
npm ci
npm run lint
npm test
npm run build
npm run preview -- --host 127.0.0.1
```

Open the preview URL and run the checklist below. Stop preview with Ctrl+C. Publish the **contents of `dist/`** to your static HTTPS host, including `assets/`, `media/`, and `_headers` on hosts that support that file. No server process, backend, database, authentication, or runtime environment variables are required. There are no client-side routes requiring SPA rewrites.

The default build is for a domain root. For a subdirectory deployment, build with `npm run build -- --base=/groceryaide/`, serve at that same prefix, and verify both the video and deferred calendar/editor chunks. The hero paths use Vite's base URL. Do not deploy `src/`, `node_modules/`, private notes, or environment files. Vite preview does not apply host-specific `_headers`; verify those on the public origin.

### Before committing and deploying

1. Review `git status --short` and `git diff`; include the supplied MP4 and SVG, new components/tests, and configuration. Keep personal `Notes.txt` out of the release.
2. Run the commands above. At 375, 768, 1280, and 1600 px, check the hero, summary tiles, search, shopping list, category menu, and calendar. Also check 320 px and 200% zoom.
3. Confirm visible silent looping playback, pause/resume, and no overlap with Add grocery. Enable reduced motion and reload: the illustration should appear with no MP4 request. Block the media URL in DevTools and reload to check fallback.
4. Using only the keyboard, add/edit an item, select a category/date, close popups with Escape, and check focus returns. Check Safari/iOS, Firefox, mobile keyboard behavior, and a screen reader on actual devices.
5. Add and edit groceries, search, mark one Used and another Discarded, restore, and delete. Verify separate history labels and counts. Reload to verify persistence. Add/remove shopping entries.
6. Export a backup, change data, import, cancel once, then confirm replacement. Test invalid JSON in a disposable profile. Never clear your only copy of an inventory.
7. On the deployed HTTPS origin, verify JS/CSS/video requests succeed, response headers apply, and Console shows no runtime/CSP errors. Export from localhost and import on the new origin if moving existing data.

## CI and Cloudflare Pages deployment

The included GitHub Actions workflow performs checks and stores a build artifact; it has no deployment step or credentials. It runs on pushes, pull requests, and manual dispatch after the files are pushed to GitHub.

Follow the upload steps above to publish your branch. Open a pull request and inspect the **Quality checks / check** job in Actions. Configure branch protection to require that check if desired; this is a separate repository setting, not something a workflow can enforce by itself.

To deploy, use Cloudflare Pages' **Git integration** and connect the chosen repository. Select the Pages flow, rather than a Worker template. Recommended settings:

| Setting                         | Value                                              |
| ------------------------------- | -------------------------------------------------- |
| Framework preset                | React (Vite)                                       |
| Production branch               | Your chosen release branch, usually `main`         |
| Root directory                  | Repository root                                    |
| Build command                   | `npm run check`                                    |
| Build output directory          | `dist`                                             |
| Node version                    | `24` via `.nvmrc`; set `NODE_VERSION=24` if needed |
| Environment variables / secrets | None required by the app                           |

The normal [Cloudflare Vite build settings](https://developers.cloudflare.com/pages/configuration/build-configuration/) use `npm run build` and `dist`. Here, `npm run check` also runs lint and tests **inside the Pages build**, so a failed check stops that deployment even though GitHub Actions runs independently. Verify the Node override against the [Pages build-image documentation](https://developers.cloudflare.com/pages/configuration/build-image/).

Once enabled, [Pages Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/) can automatically publish on pushes and create preview deployments. Review branch build controls before connecting if you want manual release control. A preview URL has its own browser storage; an empty preview inventory does not mean production data was lost.

`public/_headers` is copied to `dist/` and applied by Pages. Local Vite preview does not apply that file. The CSP assumes no externally injected analytics scripts; revisit it if adding integrations. There are no client-side routes requiring custom rewrites.

## Monitoring and recovery

For each release, record the commit SHA and deployment URL, inspect both Actions and Pages build logs, then smoke-test the deployed site: add an item, reload, edit it, mark it used, restore it, and export/import a backup. Check DevTools Console for runtime errors and Network for failed JS/CSS requests. Test the production domain's security headers, because local preview cannot validate Pages configuration.

The storage-status label and recovery warnings provide local persistence monitoring. No third-party monitoring or paid service is installed. For the MVP, use these manual checks after releases and collect reproducible bug reports (browser, URL, steps, console error; avoid sharing personal backups publicly). This does not provide automatic uptime alerts or visibility into other users' runtime failures.

If a release breaks:

1. Preserve data first: export from the affected browser if possible. Do not clear storage as the first troubleshooting step.
2. Use [Cloudflare Pages rollback](https://developers.cloudflare.com/pages/configuration/rollbacks/) to select a prior successful production deployment. This restores application files, not browser data.
3. Revert the faulty commit with `git revert <commit-sha>`, run `npm run check`, review, and push the fix through your approved release process. A revert creates an auditable new commit rather than rewriting shared history.
4. If browser data is damaged, use **Export original saved data** before resetting, then import a known-good JSON backup. Without a backup, cleared browser data cannot be recovered by the host or by a code rollback.
5. Verify the smoke test again and document the failure and the test that would have caught it.

Future schema changes need a migration and rollback plan: older app versions may reject a newer backup. Keep a known-good versioned backup before upgrades.

## CI/CD

Changes to the main branch are validated through automated GitHub Actions quality checks before merging.
