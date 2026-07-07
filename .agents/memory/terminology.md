---
name: Client terminology — topics vs categories
description: The client uses "topics" to mean what the code calls "categories" (rows in the categories table, nested under a discipline). Never use the word "category" when talking to the client.
---

## Rule
When the client says **"topics"**, they mean the selectable items within a discipline
in the `MultiDisciplineSelector` — e.g. "AI & Innovation", "Esthetic Procedures".

These are stored in the `categories` table (with a `disciplineId` foreign key).

**How to apply:** Always call them "topics" in user-facing responses. Use "categories"
only when referring to internal code/DB concepts in technical notes.

**Why:** Client explicitly corrected this on 2026-07-07 to avoid confusion.
