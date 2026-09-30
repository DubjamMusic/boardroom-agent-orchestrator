# ORBIT-MASON-30 — Seat Orbit

WAVE_ID: `2026-09-30-o-hearth`
Repo: `DubjamMusic/boardroom-agent-orchestrator`
Merge policy: **pr-only**

## Job
Bind a scored seat-orbit card so boardroom rotations stay testable without rewriting the motion docket. This is not gavel-wright (Wave K axle) and not quorum-keeper (Wave E ember). New figure, new path, new wave id.

## Responsibilities
- Own `orbit.json` only.
- Print a reproducible density to three decimals.
- Keep merge policy pr-only.
- Do not touch hustlecodex-platform/agents affirmAgent.ts or challengeAgent.ts (frozen).

## Knowledge required
- Density = (N^wN * V^wV * S^wS * D^wD)^(1 / totalWeight).
- Orbit scores seat rotation; it does not replace the docket or the seat map.
- Chair holds merge.

## Primary path this wave
`figures/orbit-mason/**` only.

## Out of scope
Do not rewrite `client/`, `server/`, or `todo.md` this wave. Seat-map enum migration stays on a separate issue.
