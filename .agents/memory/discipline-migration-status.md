---
name: Speaker discipline migration status gotcha
description: Why one-off "confirm" actions and exclusion lists in migration scripts can silently strand records, and the data-parity trap of switching a read path to a new field.
---

When a migration/auto-matching process has a "confirmed" or "reviewed" status that gets set in bulk by an admin shortcut (not real human review), that status looks identical to genuine human review to any later re-migration logic. If a re-migration script excludes everything already "confirmed," a one-time bulk action can permanently freeze a large set of records on whatever matching quality existed at the moment the bulk action ran — even after the matching logic is later improved.

**Why:** This caused production records to silently diverge from dev for months because nothing distinguished "an admin clicked confirm-all" from "a human actually reviewed this one."

**How to apply:** When fixing/re-running auto-matching logic, don't trust a "confirmed" status alone — look for an additional signal that real review happened (e.g., a linked human-entered selection) before excluding something from re-processing.

Related trap: when migrating a read path (counts/listings) from a legacy field to a new field, every code path that *writes* the legacy field must also be updated to populate the new field, and any existing rows already written before the new field existed need a backfill — otherwise records created through paths you didn't re-check (e.g. a separate approval workflow) silently disappear from the new read path even though they were never touched by the broken status logic at all.
