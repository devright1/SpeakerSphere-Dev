---
name: Speaker discipline authoritative mapping
description: How speaker->discipline tagging is sourced and why per-discipline counts don't perfectly match the source spreadsheet.
---

Speaker discipline assignment is driven by a client-provided ground-truth
spreadsheet (name -> discipline), not by algorithmic/keyword matching. The
spreadsheet data ships in the repo (`server/discipline-source-data.ts`) and is
applied on every server startup, before the best-effort auto-matcher, so it
always wins and can't be silently lost to future re-migrations, checkpoint
restores, or admin bulk "confirm" actions.

**Why:** an earlier stricter exact-discipline-name auto-matcher regressed a
distribution the client had already approved, dumping most speakers into
"Miscellaneous". The client then supplied their own spreadsheet as the
authoritative source instead of trusting any algorithm.

**How to apply:** if the client provides an updated spreadsheet, regenerate
`server/discipline-source-data.ts` from it (same row shape: `{ name,
discipline }`) rather than tweaking matching heuristics.

**Resolved duplicate-profile issue (July 2026):** the speakers table used to
contain ~25 genuine duplicate profile pairs for the same real person (same
name, two speaker IDs, often a "Dr. X" vs "X" name variant), inflating
per-discipline counts vs. the spreadsheet's unique-name totals. These were
merged (keeping the record with the more complete bio as canonical,
reassigning all referencing rows before deleting the loser). The source
spreadsheet (`discipline-source-data.ts`) was also deduplicated — it had 21
redundant name-variant rows, 3 of which pointed to conflicting disciplines
for the same person; resolved by keeping whichever variant matches the
canonical DB record.

**Gotcha to watch for:** name normalization (stripping "Dr." prefix) means
if the DB or spreadsheet ever again gets two rows that normalize to the same
key, the migration will cross-apply disciplines from both source rows to
both DB rows (last-processed row wins for all matching IDs) — check for
normalized-name collisions before trusting per-discipline counts after any
future bulk import.
