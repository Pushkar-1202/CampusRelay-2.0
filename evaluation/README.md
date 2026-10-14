# Real-message evaluation (awaiting consented samples)

No real inbox messages were available or accessed for this project. No measured extraction accuracy is claimed. Unit tests are synthetic regression examples and are not a real-world accuracy benchmark.

Collect 20–30 messages voluntarily from consenting participants. Remove names, email addresses, phone numbers, IDs, private links, attachments, and unrelated text; substitute consistent fake identifiers where matching matters. Do not commit the source dataset. `evaluation/private/` and `reports/private/` are ignored.

Before running extraction, independently label each message with this shape:

```json
[
  {
    "id": "message-01",
    "provenance": "real-redacted",
    "consent": true,
    "receivedDate": "2026-10-14",
    "text": "REPLACE WITH A CONSENTED, REDACTED REAL MESSAGE",
    "expected": {
      "name": "",
      "stage": null,
      "dates": {}
    }
  }
]
```

Include confirmations, extensions, rejection messages, forwards, ambiguous dates, unknown event names, HTML, and digests. For a digest that should be held for splitting, label no single name/stage/date-map. Keep missing fields empty instead of guessing. Record a date so missing-year extraction can be evaluated reproducibly.

Run `npm run evaluate -- evaluation/private/messages.json`. The script requires 20–30 real-redacted examples with consent metadata. It reports exact name, date-map, and stage accuracy separately, the denominator, and failed sample IDs. Date-map accuracy penalizes extra dates as well as missing/wrong dates. The report contains no raw text.

Slide wording before collection: **Real-message validation pending. Automated regression and UI checks are available; no extraction accuracy claim yet.**

Slide wording after collection: **On N consented redacted messages, exact name accuracy was X/N, date-map accuracy Y/N, and stage accuracy Z/N. Small convenience sample; broader validation is still needed.**
