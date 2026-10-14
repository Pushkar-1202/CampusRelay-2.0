# Physical device validation — pending

Desktop Chromium mobile emulation is not a test on a low-end phone. No physical phone was available to this run. Do not report this checklist as completed.

Use a consenting tester's budget Android phone and record model, RAM, Android/browser version, connection, date, and build commit. Open the Vercel preview for this new repository.

1. Load the landing page on mobile data and then with a cached reload. Verify the complete still journey is readable and the page responds during loading.
2. Scroll through the page for 30 seconds. Coarse-pointer devices disable tilt/parallax/decorative animation. Record visible stutter and delayed taps.
3. Open the workspace, paste a redacted message, edit one field, approve, then undo. Check software keyboard overlap and dialog scroll/focus.
4. Navigate calendar days, export an .ics file, and restore a backup after reading the loss summary.
5. Rotate the screen; test 200% text sizing and the browser's reduced-motion setting. Verify the countdown is wholly visible.
6. Disable storage or simulate quota failure in a test profile. Check the persistent warning and backup export.

Keep a results table with pass/fail, observed timing, screenshots with no private content, and remaining issues. Browser CPU/network throttling results must be labeled simulated, with the throttle settings stated.
