---
name: Speaker discipline migration status gotcha
description: Why re-running the discipline auto-matching logic must consider "confirmed" status speakers, not just "auto"/flagged/null.
---

The speaker→discipline auto-migration (`migrateSpeakerDisciplines` in `server/seed-disciplines.ts`) only reprocesses speakers whose `disciplineMigrationStatus` is NULL, "flagged", or "auto" with an empty `speakerCategoryIds`. An admin "bulk-confirm all auto-matched speakers" action (`/api/admin/migration-review/confirm-auto`) sets status to "confirmed" for everything that was "auto" — which permanently excludes those speakers from ever being reprocessed by improved matching logic, even though they were never reviewed by a human.

**Why:** In production, the vast majority of "confirmed" speakers got that status purely from the bulk-confirm button, not real human review, so they silently kept stale/wrong discipline tags across multiple logic improvements.

**How to apply:** When changing or fixing the discipline-matching algorithm, any one-time re-migration/reset must include `disciplineMigrationStatus IN ('auto', 'confirmed')` (not just 'auto'), gated on `speaker_discipline_ids` being empty/null (the column that never existed under the old logic — a reliable signal a speaker was tagged before the fix). Exclude speakers with a linked `speaker_applications` row that has a `selected_discipline_id` (those came from genuine applicant/admin discipline selection, not the legacy categories matcher, and should be preserved).
