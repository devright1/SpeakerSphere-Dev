---
name: speaker_topics junction has no unique constraint
description: Assigning a topic to a speaker via the speaker_topics junction table can silently create duplicates
---

Assigning a topic to a speaker inserts into the `speaker_topics` junction table via `storage.addSpeakerTopic(speakerId, topicId)`. There is no unique constraint on `(speaker_id, topic_id)`, so calling it twice for the same pair creates a duplicate row.

**Why:** Discovered while building topic-request approval — approving two separate requests that resolved to the same topic name created duplicate junction rows, which surfaced as React "duplicate key" warnings and an inflated topic list on the speaker's profile.

**How to apply:** Before calling `addSpeakerTopic`, check `getSpeakerTopicsBySpeakerId(speakerId)` for an existing match and skip the insert if already assigned.
