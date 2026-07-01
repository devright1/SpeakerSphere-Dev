---
name: Discipline vs topics distinction
description: Why speakerCategoryIds must never be auto-populated from "all categories in a discipline", and how to tell a real manual topic selection from an auto-assigned one.
---

There are two separate concepts on a speaker record that look similar but are not:
- **Discipline** (`disciplineId` / `speakerDisciplineIds`): a coarse classification (e.g. "Periodontics"), safe to auto-assign from a name→discipline mapping.
- **Topics/categories** (`speakerCategoryIds`): meant to be a small, curated subset of categories a speaker (or admin) picked for themselves. This is NOT safe to auto-derive from "every category belonging to the matched discipline" — doing so dumps 10-20 categories onto every speaker's profile as if they were hand-picked, which reads as obviously wrong/spammy in the UI.

The only trustworthy signal that `speakerCategoryIds` reflects a real human choice is `disciplineMigrationStatus === "manual"` (set only by `PUT /api/speakers/:id/discipline` when a speaker/admin explicitly saves). Any other status (`auto`, `confirmed`, `flagged`, null) means the categories were bulk-assigned by migration code and should be treated as empty for display purposes.

**How to apply:** Any migration/seeding function that assigns a discipline to a speaker should write `speakerCategoryIds: []` (never the full category list of the discipline), and should skip speakers whose status is already `"manual"` entirely (don't overwrite their discipline or their manual topic selection). Any UI that renders a speaker's topics should treat non-manual speakers as having no topics, showing only the discipline badge.
