# CampusRelay

**A living, evidence-backed timeline for student opportunities.**

CampusRelay tracks hackathons, competitions, workshops, and personal commitments as their details change. It connects participation stages, milestones, source references, and transparent history in one browser workspace.

[Open the private live Site](https://campusrelay-living-timeline.abloomsage128.chatgpt.site)

## Run locally

Requires Node.js 20 or newer. There are no package dependencies to install.

```sh
npm run dev
```

Open http://127.0.0.1:4173. Check the application and run the engine tests:

```sh
npm run check
npm test
```

## Features

- Animated landing page with floating event cards, an interactive simulated journey, scroll reveals, and a pause control
- Dark workspace styling, animated entrances, and hover feedback with reduced-motion support
- Chronological milestones, searchable event cards, and participation filters
- Import pasted communications, text files, and .eml messages
- Attach a PNG, JPEG, or WebP poster as source evidence (up to 1.5 MB)
- Extract explicit dates, names, registration IDs, URLs, venues, and participation outcomes
- Rank matches by identifiers, URLs, names, and organizer clues; mismatched IDs reduce confidence
- Preserve ambiguous proposals in a review queue, with editable facts and individual change approval
- Detect stale proposals so older reviews cannot silently replace facts changed in another tab
- Record previous/new values, stages, sources, and timestamps
- Add and edit events, including notes, venues, and personal commitments
- ConflictIQ highlights same-day commitments and deadlines within two days
- Export all or individual events as an iCalendar (.ics) snapshot
- Copy/download team summaries that omit raw emails, attachments, registration IDs, and notes
- Export and restore validated JSON backups
- Persist records in localStorage and reflect changes across browser tabs

## Demo

1. Select **Try the demo** on the overview.
2. Analyze the simulated Northstar deadline extension.
3. Review the original message and compare October 17 with October 20.
4. Approve the change and inspect its source-backed history.
5. Import **Status update** to advance participation.
6. Use **Uncertain match** to test review without an event identifier.

Sample events and simulated messages are labeled. The demo does not represent live monitoring or measured extraction accuracy.

## Reliability and scope

Text extraction runs locally using deterministic rules; there is no connected AI model. Images are retained as evidence, and their text must be pasted by the user. URLs are recorded as references rather than fetched. Forwarding, remote storage, authentication, live calendar feeds, and team synchronization are future integration work.

All imports require review. A high match identifies a likely event, without authenticating the source. Approval records the student's decision. Ambiguous numeric dates are withheld, assumed years are flagged, and invalid dates are rejected.

ConflictIQ compares known dates. Without start/end times, same-day commitments are potential clashes. Nearby deadlines indicate workload pressure. Calendar exports are snapshots and must be exported again after updates. Records stay in the current browser; export a backup before clearing site data or switching devices.

## Structure

| Path | Purpose |
| --- | --- |
| `dist/index.html` | App shell and accessible dialogs |
| `dist/styles.css`, `dist/enhancements.css` | Responsive interface |
| `dist/engine.js` | Extraction, matching, changes, conflicts, calendar, backup validation |
| `dist/app.js` | Browser state, views, and review interactions |
| `dist/landing.js`, `dist/landing.css` | Animated product story and interactive landing demonstration |
| `dist/workspace-motion.css` | Dark workspace styling and transition effects |
| `dist/seed.js` | Labeled demonstration records |
| `scripts/serve.cjs` | Dependency-free local server |
| `tests/engine.test.cjs` | Reconciliation regression tests |

Serve `dist/` on any static host. No build step is required.

The landing page includes an automatic perspective hero, a four-chapter pinned scroll story, visible-section demo autoplay, scroll progress and a persistent motion toggle. Native scrolling remains available; reduced-motion preferences disable decorative movement. The story is explicitly simulated.
