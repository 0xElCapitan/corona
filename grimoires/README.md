# grimoires/

Local-and-tracked state for Loa-driven cycles plus framework-internal scratch space. The directory deliberately mixes **public-defensible cycle deliverables** with **operator-specific or auto-generated state**. This README documents where the boundary sits and why.

## Public / private policy

**Track-by-default**: cycle deliverables that other operators (or the construct network) benefit from seeing — PRD, SDD, sprint plans, sprint ledgers, calibration artifacts, sprint review/audit verdicts.

**Ignore-by-default**: framework-internal scratch, operator-specific input, and auto-generated logs.

We keep the boundary at the **file / subdirectory level inside `grimoires/loa/`** rather than introducing a separate `grimoires/pub/` namespace.

### Why per-path instead of `grimoires/pub/`

1. **Framework conventions**: Loa skills write their outputs to paths under `grimoires/loa/` by default. Switching to `grimoires/pub/` would require either an `LOA_GRIMOIRE_DIR` override (creates skill-vs-config drift risk) or manual artifact copy-out per cycle (operator burden + duplication risk).
2. **Ecosystem consistency**: Sibling Echelon constructs (e.g. TREMOR, BREATH) commit their `grimoires/loa/` content. Blanket-ignoring would break cross-construct cycle archaeology and ecosystem-trust signals.
3. **Boundary precision**: The genuinely-private subset is narrower than "everything in loa/" — per-path gitignore captures it cleanly without overshooting.

If the per-path approach ever stops scaling (e.g. private subdirs sprawl past 5–6 entries), revisit `grimoires/pub/` as a dedicated migration cycle.

## What's public (tracked)

| Path | Purpose |
|------|---------|
| `loa/prd.md` | Cycle requirements; construct-network discoverability |
| `loa/sdd.md` | System design; architectural transparency |
| `loa/sprint.md` | Sprint plan with task IDs; cycle audit trail |
| `loa/ledger.json` | Sprint ledger (global numbering across cycles) |
| `loa/calibration/<construct>/` | Calibration manifests + frozen protocol + theatre authority map + run-N certificates — the whole point of construct-network deployment |
| `loa/a2a/sprint-N/reviewer.md` | Implementation report with AC verification (cycle-057 #475 gate) |
| `loa/a2a/sprint-N/engineer-feedback.md` | Senior tech lead review verdict |
| `loa/a2a/sprint-N/auditor-sprint-feedback.md` | Security audit verdict + OWASP coverage |
| `loa/a2a/sprint-N/COMPLETED` | Sprint completion marker |

## What's private (gitignored)

| Path | Reason |
|------|--------|
| `loa/context/` (no exceptions) | User-provided context for `/plan-and-analyze`; may carry sensitive business information per the framework's own template |
| `loa/analytics/` | HITL permission-prompt analytics; operator-specific patterns |
| `loa/a2a/trajectory/` | Auto-generated agent decision logs; high volume, low public value |
| `loa/a2a/subagent-reports/` | Internal validation reports from `/validate`; framework-internal |

Plus repo-level ephemeral state outside `grimoires/`:

| Path | Reason |
|------|--------|
| `.beads/.br_history/` | Beads operation history (`.beads/issues.jsonl` is the canonical export) |
| `.run/audit.jsonl` | Autonomous-execution audit log |

The full canonical exclusion list lives in the repo's root [`.gitignore`](../.gitignore).

## Operator-preference items

| Path | Default | Notes |
|------|---------|-------|
| `loa/NOTES.md` | Track | Session-continuity log; useful for cycle audit. If yours accumulates sensitive in-flight thinking, gitignore locally. |
| `loa/reality/` | Track placeholder, ignore generated content per cycle | Auto-generated `/ride` outputs may contain code-derived sensitive bits. Decide per cycle whether the extracted-prd.md / extracted-sdd.md / component-inventory.md should ship. |

## Adding new state under `grimoires/`

When you introduce a new sub-path:

1. **Cycle deliverable that others would benefit from auditing** → leave tracked. Add a row to the "public" table above when it stabilizes.
2. **Framework-internal scratch / operator-specific input / auto-generated** → add to root `.gitignore`. Add a row to the "private" table above.
3. **Genuinely ambiguous** → flag it in the operator review of the originating sprint and decide there. Don't commit until resolved.

## History

- 2026-04-30 — Initial policy authored during cycle-001 Sprint 0 close. `grimoires/loa/context/` made gitignored "no exceptions" per operator override of the framework template's "all files except this README" stance. `analytics/`, `a2a/trajectory/`, `a2a/subagent-reports/` added preemptively.
