# CampusRelay 2.0

[![Quality checks](https://github.com/Pushkar-1202/CampusRelay-2.0/actions/workflows/ci.yml/badge.svg)](https://github.com/Pushkar-1202/CampusRelay-2.0/actions/workflows/ci.yml)

A browser-local, evidence-backed timeline for student opportunities. This is a separate continuation of CampusRelay; the original repository and hosted version are preserved.

## Run

Requires Node.js 22 or newer.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:4173. Source lives in `src/`; `npm run build` bundles and minifies it into `dist/`.

## Improvements

- Summary-first review, with the full form behind **Edit details**.
- Automatic source detection, clipboard paste, image attachments, .eml uploads/drop, and explicit batch boundaries.
- HTML and quoted-forward cleanup, abbreviated dates, selected Hinglish deadline patterns, and EOD warnings without inventing an hour or time zone.
- Seeded uncertain review. Ambiguous messages cannot silently merge; multi-event digests are flagged and blocked from approval as one event.
- Approval receipts name the change and link to the timeline. Old dates remain struck through beside new dates.
- Date freshness, stale-source warnings, and latest-field change undo with preserved history.
- iCalendar snapshot export with stable UID, sequence, and a 24-hour deadline reminder.
- Privacy panel, workspace wipe, restore replacement preview, storage-failure banner, and backup export.
- Readable system typography, mobile countdown fix, keyboard calendar, focus restoration, non-color labels, and a readable still hero.
- Bundled/minified assets, no remote fonts, deferred extended landing motion, and motion disabled on coarse-pointer or reduced-motion devices.
- Engine regressions, Playwright interaction/security/mobile tests, axe audits, and GitHub Actions.

## Try the workflow

1. Open the workspace. The sample includes an uncertain review.
2. Click **Import update →**, then the simulated deadline example.
3. Review the summary and approve the date change.
4. Follow the receipt to the timeline; inspect old/new values and source.
5. Open the event history and undo the latest change.

Sample communications are explicitly simulated. They are not evidence of live monitoring or measured extraction accuracy.

## Trust and scope

Extraction is deterministic and local. There is no connected AI service, OCR, authenticated email ingestion, public-page fetching, server database, or live team synchronization. Images are evidence attachments; paste their text for extraction. Multipart email and arbitrary language formats may need manual cleanup.

Sender addresses and forwarded headers are **read, not authenticated**. Every import requires review. Ambiguous numeric dates are withheld, assumed years are flagged, and EOD retains an explicit uncertainty note. Freshness records local review/update time, not a live organizer-website check.

Imported content stays in this browser's localStorage. It is never sent to an AI provider or uploaded by this app. The host receives normal asset requests. Browser storage is origin-specific and not encrypted by this app. Export a backup before changing hosts. Wipe removes local records, not downloaded backups.

Calendar exports are snapshots, not subscription feeds. Alarms are 24 hours before an all-day deadline's start; alarm support and re-import behavior depend on the calendar client. ConflictIQ detects date-level potential clashes without assuming class schedules or unknown event times.

## Verify

```sh
npm run check
npm test
npm run build
npx playwright install chromium
npm run test:ui
```

`npm run test:a11y` runs axe audits. Reports are generated locally and uploaded by CI. Automated audits cannot establish complete accessibility conformance.

The mobile smoke test uses a 390px touch viewport, fourfold CPU throttling, 150ms latency, and limited bandwidth. It is a simulation; physical low-end-phone testing remains pending. See [device validation](docs/device-validation.md).

### Real-message evaluation remains pending

No consented real inbox dataset is available here. **No real-world name/date/stage accuracy percentage is claimed.** Unit fixtures are synthetic regression cases.

See [evaluation protocol](evaluation/README.md) to collect 20–30 redacted, consented messages, record independent answers, and run `npm run evaluate -- evaluation/private/messages.json`. Private data and private reports are ignored by Git.

## Deploy on Vercel

Import **Pushkar-1202/CampusRelay-2.0** with:

| Setting | Value |
| --- | --- |
| Root Directory | Repository root (leave blank) |
| Framework Preset | Other |
| Install Command | npm ci |
| Build Command | npm run build |
| Output Directory | dist |
| Environment variables | None |

`vercel.json` includes build/output settings. Remove conflicting old project overrides. Landing opens at `/`, workspace at `/#overview`; fragment navigation needs no rewrite.

## Source layout

- `src/engine.js`: extraction, matching, validation, reconciliation, undo, calendar.
- `src/app.js`, `src/workspace.js`, `src/reliability.js`: workspace and review flows.
- `src/landing.js`, `src/cinematic.js`: animated landing and still fallback.
- `src/accessibility.css`: typography, focus, contrast, responsive fixes.
- `scripts/`: build, local server, syntax checks, evaluation runner.
- `tests/`: engine and browser regressions.
