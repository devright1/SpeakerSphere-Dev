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

**Known caveat:** the speakers table contains genuine duplicate profile rows
for the same real person (same name, two different speaker IDs — roughly
25+ pairs, often a "Dr. X" vs "X" name variant). The authoritative mapping
applies to every DB row matching a given name, so a handful of disciplines
end up with slightly more tagged speakers than the spreadsheet's unique-name
count (off by 1-7, worst case Miscellaneous). This is a pre-existing
duplicate-listing data-quality issue, not a tagging bug — resolving it means
merging/deleting duplicate speaker profiles, which needs explicit user
sign-off before doing anything destructive.
