---
name: Two parallel speaker-topic systems
description: There are two independent "topics" mechanisms for speakers; a fix or feature touching one must be checked against the other.
---

The app has two unrelated systems that both represent a speaker's "topics":

1. **Legacy `speakingTopics` junction table** (`speakerTopics` join table) — populated by
   the original topic-assignment flow (`/api/speakers/:id/topics` PUT, admin bulk import,
   application approval).
2. **Discipline/category system** — `speakers.speakerCategoryIds` (+ `speakerDisciplineIds`,
   `disciplineId`) — populated by the newer "Disciplines & Topics" editor in the speaker
   dashboard. Categories here are scoped to a discipline (`categories.disciplineId`), fetched
   via `getCategoriesByDiscipline`, NOT `getCategories()` (which only returns legacy
   discipline-less categories and will silently return nothing for these).

`GET /api/speakers/:id/topics` originally only read system (1), so any speaker who set their
topics only through the dashboard editor (system 2) showed "No topics available" on speaker
cards / listings, even though their profile page (which reads `speakerCategoryIds` directly)
displayed them correctly.

**Why:** the two systems were built at different times and never unified; nothing in the
schema or naming makes the split obvious.

**How to apply:** when fixing/extending anything about speaker "topics" (display, counts,
search, filters), check whether the code path reads `speakerTopics`/`speakingTopics` or
`speakerCategoryIds`/`speakerDisciplineIds`, and whether it needs to handle both. Prefer
falling back from (1) to (2) rather than assuming only one exists.

There's also a third, adjacent table: `topicRequests` (speaker-submitted requests for new
topics). Admin approval creates a `categories` row (+ matching `speakingTopics` row sharing
name/disciplineId) but leaves the original `topicRequests` row's status as `"approved"`
forever — it is never re-synced. If an admin later deletes that category/topic, any cascade
cleanup must also flip matching `topicRequests` rows (matched by `topicName` + `disciplineId`)
away from `"approved"`, or the speaker dashboard's "Your Requests" list keeps showing a stale
"Approved" badge for a topic that no longer exists anywhere else.
