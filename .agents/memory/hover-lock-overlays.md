---
name: Tailwind hover-reveal lock overlays must toggle real visibility, not just opacity
description: Pattern for building a "hover to see upgrade prompt" overlay on a locked/greyed section, and why opacity-only toggling fails automated visibility checks.
---

When building a hover-triggered overlay (e.g. "hover over locked content to see an upgrade
prompt") with Tailwind's `group`/`group-hover`, don't gate visibility with `opacity-0
group-hover:opacity-100` alone. Playwright's `isVisible()` (and most automated
accessibility/visibility checks) only look at `display`/`visibility`, not computed
`opacity` — an `opacity-0` element is still reported "visible" even though it's invisible
to the eye. This makes e2e assertions like "overlay should not be visible before hover"
produce false failures even when the UI is behaving correctly.

**Why:** confirmed via a real e2e test run — an opacity-only overlay looked correct in
screenshots (fully hidden pre-hover) but the test framework flagged it as a visibility bug.

**How to apply:** combine `invisible group-hover:visible` with the opacity classes (e.g.
`invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity`), and
add `pointer-events-none group-hover:pointer-events-auto` so the hidden overlay doesn't
intercept clicks/hover-blocking when not shown. This keeps the fade transition while also
making the hidden state align with what both users and automated tests expect "not
visible" to mean. Same pattern applies to the existing SpeakerSphere reviews "Recent
Downloads" Premier-lock blur overlay if it's ever made hover-triggered instead of always-on.
