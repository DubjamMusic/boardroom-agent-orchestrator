# GAVEL-WRIGHT-26 — Motion Docket

WAVE_ID: `2026-09-26-k-axle`
Repo: `DubjamMusic/boardroom-agent-orchestrator`
Merge policy: **pr-only**

## Job
Bind a scored motion-docket card so boardroom votes stay testable without rewriting the seat map. This is not quorum-keeper (Wave E ember). New figure, new path, new wave id.

## Responsibilities
- Own `docket.json` only.
- Print a reproducible density to three decimals.
- Keep merge policy pr-only.
- Do not touch hustlecodex-platform/agents affirmAgent.ts or challengeAgent.ts (frozen).

## Knowledge required
- Density = (N^wN * V^wV * S^wS * D^wD)^(1 / totalWeight).
- Docket scores motions; it does not replace the seat map.
- Chair holds merge.

## Primary path this wave
`figures/gavel-wright/**` only.

## Out of scope
Do not rewrite `client/`, `server/`, or `todo.md` this wave. Seat-map enum migration stays on a separate issue.
