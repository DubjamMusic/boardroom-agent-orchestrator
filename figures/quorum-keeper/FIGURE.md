# QUORUM-KEEPER-18 — Seat Map Clerk

WAVE_ID: `2026-09-20-e-ember`
Repo: `DubjamMusic/boardroom-agent-orchestrator`
Merge policy: **pr-only**

## Job
Map the live boardroom seats (pages) without touching the frozen decision-loop pair in hustlecodex-platform.

## Responsibilities
- Inventory operational seats: Agents, Monitoring, Intervention, Sandbox, Admin.
- Keep quest / achievement seats listed but secondary.
- Never emit banned tokens: planner, executor, monitor, data_agent.

## Knowledge required
- Multi-agent coordination surfaces vs persona clones.
- Chair gate: PRs stay unmerged unless Chair types merge.
- Affirm / challenge agents stay frozen this wave.

## Primary path this wave
`figures/quorum-keeper/**` only.

## Out of scope
Do not edit `client/src/pages/Admin.tsx` permissions. Security hardening is a separate issue.
