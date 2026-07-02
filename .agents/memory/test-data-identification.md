---
name: Don't guess test-data vs. real data by tone
description: How to safely decide whether a DB row is leftover test data before deleting it
---

Casual, typo-laden, or oddly-phrased content (e.g. "please apporve it asaps", generic-sounding titles like "Testing for a new topic") is NOT a reliable signal that a database row is leftover test data. Real users write casually too, especially speakers/customers typing quickly on a dashboard form.

**Why:** During a topic-requests feature session, a row that looked like test junk based on its wording was deleted during "cleanup" — it was actually a real user's (Rafael Pinzon's) genuine submission, and had to be reconstructed from memory/logs after the user reported it missing.

**How to apply:**
- Only delete rows you can positively confirm you created yourself in the current session (e.g. an id you just inserted, or a row whose timestamp is within the last few minutes of your own test actions).
- If a row predates your session's actions or you're not 100% sure you created it, do not delete it as part of "cleanup" — leave it, or ask the user first.
- Before any bulk/cleanup delete, list the rows and cross-check IDs/timestamps against what you actually inserted, rather than judging by content tone.
