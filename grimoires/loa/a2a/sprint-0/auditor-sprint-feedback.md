# Sprint 0 Security Audit — APPROVED - LETS FUCKING GO

**Auditor:** Paranoid Cypherpunk Auditor (`auditing-security` skill via `/audit-sprint`)
**Sprint:** sprint-0 (cycle-001-corona-v3-calibration)
**Date:** 2026-04-30
**Verdict:** **APPROVED**
**Findings:** 0 CRITICAL, 0 HIGH, 0 MEDIUM, 2 LOW (informational)

---

## APPROVED - LETS FUCKING GO

Sprint 0 passes security audit. Zero blocking findings. Both LOW findings are informational hygiene items, not security risks.

---

## Audit Scope

Sprint 0 was scoped as **metadata + scaffolding work**, not new runtime logic. Audit surface assessed:

| Surface | Risk Class | Audit Focus |
|---------|------------|-------------|
| `scripts/construct-validate.sh` | **highest in this sprint** | Shell script executes locally; bash strict-mode posture, command injection, tempfile handling, path traversal, untrusted-input execution |
| `construct.yaml` (new v3 manifest) | declarative metadata | Hardcoded secrets, URL safety, env-var posture |
| `schemas/{construct,persona,expertise}.schema.{json,yaml}` | declarative | Vendored byte-equal from `construct-base@b98e9ef`; no execution surface |
| `identity/{CORONA.md,persona.yaml}` | documentation | Persona metadata; no executable content |
| `skills/corona-theatres/{SKILL.md,index.yaml}` | documentation + capability metadata | `allowed-tools` declarations, capability claims |
| `examples/tremor-rlmf-pipeline.md` | documentation only | Verified NO runtime coupling to TREMOR (paper composition) |
| `src/theatres/proton-cascade.js` | runtime code | RENAME-ONLY edits per engineer report — verified |
| `package.json` | manifest | Zero runtime deps confirmed |

**Files NOT modified (operator hard constraints honored)**: `spec/construct.json` (legacy, retained), `spec/corona_construct.yaml` (legacy partial, retained), `C:\Users\0x007\tremor` and `C:\Users\0x007\breath` (read-only refs), `.claude/` (System Zone).

---

## OWASP Top 10 (2021) Coverage

| OWASP | Relevance to Sprint 0 | Finding |
|-------|----------------------|---------|
| A01 Broken Access Control | N/A — CORONA has no auth/authz surface | Clean |
| A02 Cryptographic Failures | N/A — no crypto in CORONA | Clean |
| A03 Injection | Shell script command-substitution + yq queries audited | **Clean** — no eval, no exec, no shell-out to user input; yq query field names are hardcoded loop iterators (`schema_version`, `name`, `slug`, `version`, `description`, `author`, `model_tier`, etc.); user-controllable values validated against enum lists (sonnet\|opus\|haiku, etc.) |
| A04 Insecure Design | Sprint 0 = scaffold + metadata, no design surface introduced | Clean |
| A05 Security Misconfiguration | Validator wrapper tightened to upstream parity (Round-1 hotfix); no insecure defaults | Clean |
| A06 Vulnerable and Outdated Components | Zero runtime deps confirmed (`package.json:32 "dependencies": {}`); vendored schemas tracked with documented refresh policy in sprint-0-notes.md | **Informational** (LOW-1, see below) |
| A07 Auth/Identification Failures | N/A — CORONA does not authenticate | Clean |
| A08 Software & Data Integrity | Schemas vendored byte-equal; no runtime data tampering surface | **Informational** (LOW-1, see below) |
| A09 Security Logging & Monitoring | N/A — CORONA logs to stdout for operator visibility; no sensitive data in logs | Clean |
| A10 SSRF | Runtime HTTP fetches are to known SWPC/DONKI URLs (no Sprint 0 changes; proton-cascade.js rename-only) | Clean |

---

## Detailed Surface Audits

### 1. `scripts/construct-validate.sh` (210 lines, executable)

**Hardening checks**:

| Check | Line | Status |
|-------|------|--------|
| `set -euo pipefail` (strict mode) | 21 | ✓ |
| `mktemp` for tempfiles (no static `/tmp/` paths) | 165, 191 | ✓ |
| `trap 'rm -f "$tmp"' EXIT` for primary tempfile cleanup | 166 | ✓ |
| Command-injection avoidance (yq queries use hardcoded field names) | 50, 67-68, 113, 127 | ✓ |
| Path-traversal protection on skill paths (`*".."*` and `/*` rejected) | 87-92 | ✓ |
| Path-traversal protection on persona paths | 184-186 | ✓ |
| No `eval`, no `exec`, no backtick command substitution | (verified by grep) | ✓ |
| User-controllable values validated against enum allowlists | 137-156 | ✓ |
| No execution of file contents (only declarative parsing via yq + ajv) | (verified) | ✓ |
| No network calls (purely local file operations) | (verified by grep) | ✓ |

**Verdict**: ✓ No injection, no path-traversal, no privilege escalation, no untrusted-input execution. Script is well-hardened for a local-developer CLI tool.

### 2. `construct.yaml` (196 lines)

| Check | Status |
|-------|--------|
| No hardcoded API keys, tokens, passwords, or private keys | ✓ |
| `NASA_API_KEY` declared as **optional** with `DEMO_KEY` fallback (`requirements.env_vars`) | ✓ |
| `repository.url` and `repository.homepage` use `https://` | ✓ |
| `auth: "api_key"` in `data_sources` block (preserved from spec/construct.json) is a **type label**, not a credential | ✓ |
| `pack_dependencies: []` (no remote git+url dependencies that could be hijacked) | ✓ |

**Verdict**: ✓ Clean. No secrets, no insecure URLs, no untrusted dependencies.

### 3. Vendored schemas (`schemas/*.{json,yaml}`)

| Check | Status |
|-------|--------|
| Schemas are byte-equal copies from `construct-base@b98e9ef` (verified via SHA in sprint-0-notes.md "Acquisition source" table) | ✓ |
| JSON Schema 2020-12 declarative documents — no executable content | ✓ |
| No remote `$ref` URLs (schemas use local refs only) | ✓ |
| No `.symbol`-style escape characters or unsafe patterns | ✓ |

**Verdict**: ✓ Clean. **LOW-1 informational note**: see Findings section below for vendor-drift hygiene.

### 4. `identity/CORONA.md` + `identity/persona.yaml`

| Check | Status |
|-------|--------|
| No secrets, no PII, no executable content | ✓ |
| `persona.yaml` validates against `schemas/persona.schema.yaml` | ✓ |
| `model_preferences.default_tier: sonnet` (no privileged-tier escalation claim) | ✓ |

**Verdict**: ✓ Clean.

### 5. `skills/corona-theatres/{SKILL.md,index.yaml}`

| Check | Status |
|-------|--------|
| `allowed-tools: []` in SKILL.md frontmatter (explicit empty allowlist; documentation-only skill) | ✓ |
| `user-invocable: false` (skill not exposed as slash-command) | ✓ |
| `capabilities.danger_level: safe` (lowest danger tier) | ✓ |
| `capabilities.requires.tool_calling: false` (no tool surface) | ✓ |
| No `pack_dependencies` introduced via this skill | ✓ |

**Verdict**: ✓ Clean. Defensive defaults applied throughout — explicit empty `allowed-tools`, `user-invocable: false`, `danger_level: safe`.

### 6. `examples/tremor-rlmf-pipeline.md`

| Check | Status |
|-------|--------|
| Documentation only; explicit "What this composition is NOT" section verifies NO runtime coupling | ✓ |
| Read-only inspection of TREMOR's `spec/construct.json` was non-mutating (engineer-feedback.md round-1 confirms TREMOR was NOT modified) | ✓ |
| No code blocks that would execute against TREMOR | ✓ |

**Verdict**: ✓ Clean.

### 7. `src/theatres/proton-cascade.js` (renamed surfaces)

| Check | Status |
|-------|--------|
| Edits are rename-only (verified): JSDoc text, parameter name `r_scale_threshold` → `s_scale_threshold`, default `'R1'` → `'S1'`, const `R_SCALE_THRESHOLDS` → `S_SCALE_THRESHOLDS_PROXY`, question template "blackouts" → "proton events" | ✓ |
| TODO comment at line 60-61 names Sprint 2 owner (`corona-19q`) for future binding work — visible to future engineers | ✓ |
| No new logic, no new control flow, no new HTTP/network surface | ✓ |
| `node --test tests/corona_test.js` → 60/60 pass post-rename | ✓ |
| Wheatland+Poisson math preserved (operator-validated as proton-event-correct) | ✓ |

**Verdict**: ✓ Clean. Pure documentation + identifier rename; no security surface change.

### 8. `package.json`

| Check | Status |
|-------|--------|
| `"dependencies": {}` (zero runtime deps; immune to A06 Vulnerable Components) | ✓ |
| `"engines.node": ">=20.0.0"` (modern Node.js, not EOL) | ✓ |
| `"scripts"` block unchanged from pre-Sprint-0 (no new shell-out surface) | ✓ |

**Verdict**: ✓ Clean.

---

## Findings (Informational Only)

### LOW-1: Schema vendor checksum/signature hygiene (A06/A08 hygiene)

**Severity**: LOW (informational)
**Surface**: `schemas/{construct,persona,expertise}.schema.{json,yaml}`

The schemas were vendored byte-equal from `construct-base@b98e9ef` and the commit SHA is documented in `grimoires/loa/calibration/corona/sprint-0-notes.md` "Acquisition source" table. However, no checksum/signature is recorded against the vendored files themselves — a future re-vendor pass that pulls the wrong commit would not be locally detectable.

**Recommendation**: when Sprint 7 finalizes publish-readiness (per C7 / sprint-0-notes.md "Refresh policy"), add a `schemas/CHECKSUMS.txt` (SHA-256 of each vendored file) generated at vendor time. Re-vendor scripts compare new schema files against CHECKSUMS.txt to surface unintended drift.

**Owner**: Sprint 7 publish-readiness bundle (alongside C6 + C7 carry-forward).
**Blocking?**: No. Operator already documented the refresh policy (sprint-0-notes.md "Refresh policy" section) — this finding tightens that procedure.

### LOW-2: `tmp2` not registered in EXIT trap (engineering hygiene, no security impact)

**Severity**: LOW (informational)
**Surface**: `scripts/construct-validate.sh:191-197`

The primary tempfile `$tmp` (line 165) is registered with `trap 'rm -f "$tmp"' EXIT` (line 166), so it's cleaned up regardless of exit path. The secondary tempfile `$tmp2` (line 191) relies on an explicit `rm -f "$tmp2"` at line 197. If `yq -o=json "$persona_path"` (line 192) fails or `ajv validate` (line 193) exits non-zero in a way that triggers `set -e`, the script terminates and the EXIT trap fires for `$tmp` only — `$tmp2` would leak in the OS tempdir until the next OS cleanup pass.

**Security impact**: NONE. The leaked tempfile contains the operator's `identity/persona.yaml` content converted to JSON — declarative metadata already present in the repo, not a secret. The tempfile lives in a private OS tempdir (`mktemp -t persona-XXXXXX.json`) with default per-user permissions. OS-level cleanup eventually removes it.

**Recommendation**: extend the EXIT trap to cover `$tmp2`:

```bash
trap 'rm -f "$tmp" "${tmp2:-}"' EXIT
```

**Owner**: Sprint 7 publish-readiness bundle (low-priority hygiene; pairs naturally with the C7 L2-gate work that touches this script).
**Blocking?**: No. This is engineering hygiene, not a vulnerability.

---

## Security Checklist Summary

| Category | Status |
|----------|--------|
| **Secrets**: No hardcoded credentials, proper env-var posture | ✓ PASS |
| **Auth/Authz**: N/A in CORONA (no auth surface) | ✓ N/A |
| **Input Validation**: yq queries hardcoded; enum allowlists; path-traversal checks | ✓ PASS |
| **Data Privacy**: No PII handling; public weather data only | ✓ PASS |
| **API Security**: N/A (CORONA is consumer, not server) | ✓ N/A |
| **Error Handling**: `set -euo pipefail`; ajv errors propagate; no info disclosure | ✓ PASS |
| **Code Quality**: 60/60 tests pass; lint-clean validator wrapper | ✓ PASS |
| **Dependency Posture**: Zero runtime deps (`package.json:32`) | ✓ PASS |
| **Vendor Integrity**: Schemas byte-equal from upstream `b98e9ef`; SHA documented | ✓ PASS (LOW-1 hygiene note) |
| **Tempfile Handling**: mktemp + trap-based cleanup | ✓ PASS (LOW-2 hygiene note) |

**Red flags checked**:
- Private keys in code: NONE
- SQL via string concatenation: N/A (no SQL)
- User input not validated: N/A (no user input surface in Sprint 0)
- Empty catch blocks: N/A (Sprint 0 didn't introduce error-handling code)
- No tests for critical functionality: 60/60 baseline preserved
- N+1 query problems: N/A

---

## Carried-Forward Concerns from Review

The senior tech lead's `engineer-feedback.md` Round-2 documents non-blocking concerns C3-C7 with sprint assignments. From a security-audit perspective:

| ID | Concern | Security Relevance |
|----|---------|-------------------|
| C3 | T4 naming-vs-semantic gap (S_SCALE keys map to flare-class strings) | None — naming clarity, not security |
| C4 | Zero test coverage for s_scale_threshold rename | Low security relevance; test debt is a quality concern |
| C5 | composition_paths overclaims grimoires/loa/a2a/ | None — declarative metadata correctness |
| C6 | commands.path → JS files diverges from upstream convention | None — registry tooling friction, not security |
| C7 | Local validator is L0+L1 only (no L2 publish gates) | **Marginal** — L2 includes TODO/FIXME rejection which catches accidental secrets-in-comments. Sprint 7 should add this. |

**No new security findings introduced by C3-C7**. C7's L2 gap is the only one with marginal security relevance and is already assigned to Sprint 7 publish-readiness.

---

## Beads Status

All Sprint 0 tasks remain `closed` with `review-approved` labels (from `/review-sprint sprint-0` Round-2). Adding `security-approved` labels via this audit:

- `corona-3sh` (validator acquisition)
- `corona-qv8` (identity files)
- `corona-1r5` (v3 spec migration)
- `corona-222` (T4 cleanup)
- `corona-1mv` (theatre-authority.md)
- `corona-1g6` (TREMOR reference)
- `corona-3oh` (validator green final gate)
- `corona-315` (hotfix: skills scaffold + validator strictness)

---

## Decision

**APPROVED - LETS FUCKING GO**

Sprint 0 passes security audit. Zero CRITICAL, zero HIGH, zero MEDIUM findings. Two LOW informational findings tracked for Sprint 7 publish-readiness. Sprint 1 unblocks; operator may proceed when ready.

`COMPLETED` marker created at `grimoires/loa/a2a/sprint-0/COMPLETED`.

---

*Audited by Paranoid Cypherpunk Auditor (`auditing-security` skill). OWASP Top 10 (2021) coverage applied. Sprint 0 metadata + scaffolding scope means a thin-but-genuine audit; the higher-leverage security audit will be Sprint 6 (lightweight input-validation review of SWPC + DONKI parsers + backtest corpus loader) and Sprint 7 (publish-readiness L2 gates including secrets-in-comments rejection).*
