---
name: Speaker application validation
description: The speaker-application POST route validates input in two independent layers
---

The `POST /api/auth/speaker-application` route validates submitted data in TWO places that must stay in sync:

1. **express-validator** middleware in `server/security.ts` (`validators.speakerApplication`) — runs first, applied at the route in `server/routes.ts`.
2. **drizzle-zod** `insertSpeakerApplicationSchema` (`.parse`) inside the route handler.

**Why:** A frontend field change (e.g. making `selectedTopicIds` optional and adding required `selectedDisciplineId`/`selectedCategoryIds`) silently failed because security.ts still required exactly 3 `selectedTopicIds`, rejecting valid submissions before they reached the zod parse.

**How to apply:** Whenever you add/remove/change required application fields, update BOTH the express-validator chain in security.ts AND verify the zod insert schema. Test with a real curl POST to confirm it isn't rejected.
