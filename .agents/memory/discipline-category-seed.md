---
name: Discipline category seed wipes dynamic rows
description: seedDisciplines() startup sync deletes any categories row not present in the hardcoded DISCIPLINE_DATA list — anything created at runtime (e.g. from admin-approved speaker topic requests) must be explicitly exempted or it is deleted on the very next server restart.
---

`server/seed-disciplines.ts` treats the hardcoded `DISCIPLINE_DATA` array as the sole source of truth for each discipline's category list. On every startup it diffs existing `categories` rows against that list and **deletes** any row whose name isn't in it (and strips the ID from `speakers.speakerCategoryIds`).

**Why:** This is by design for keeping the static taxonomy in sync with a source spreadsheet, but it silently destroys any category created dynamically elsewhere in the app (e.g. an admin approving a speaker's custom topic request) — the fix looks like it works right after approval, then vanishes on the next deploy/restart.

**How to apply:** Any code path that creates a `categories` row outside of `seedDisciplines()` must mark it in a way the sync loop will skip when computing rows to delete (e.g. an `isCustom` boolean column checked in the `toDelete` filter). Before debugging "why did my new category disappear," check whether it was created outside the seed script and whether it's exempted from the deletion diff.
