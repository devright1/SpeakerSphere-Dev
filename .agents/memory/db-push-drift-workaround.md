---
name: db:push blocked by speaking_topics drift
description: npm run db:push fails interactively due to pre-existing schema drift on the speaking_topics table
---

`npm run db:push` prompts interactively to truncate the `speaking_topics` table because of a unique constraint (`speaking_topics_discipline_name_unique`) drift. The sandbox has no TTY, so the command fails outright rather than prompting.

**Why:** The interactive prompt can't be answered non-interactively, and force-accepting it would truncate 180+ rows of production topic data.

**How to apply:** For additive schema changes (new tables/columns), apply them directly with `psql "$DATABASE_URL" -c "CREATE TABLE ..."` / `ALTER TABLE ...` that exactly matches what's defined in `shared/schema.ts`, instead of running `db:push`. Do not attempt `db:push --force` without first resolving the underlying drift with the user's input, since it risks truncating `speaking_topics`.
