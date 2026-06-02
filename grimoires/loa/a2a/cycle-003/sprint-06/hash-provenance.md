# CORONA cycle-003 — Sprint S06 Corpus-Hash Provenance

**Artifact**: final `corpus_hash` computation provenance + reproduction (sprint-plan S06 Task 2; FR-C6-1 / G-1).
**Sprint**: S06 — Review / Audit / Closeout · **Branch**: `cycle-003-s06-closeout` · **Base**: `cycle-003` @ `34e7680` (S05).
**Date**: 2026-06-01.
**Scope note**: this is a **content hash** over corpus files. It is **not** a fit, refit, score, Brier, runtime replay, or backtest, and it asserts **no** calibration/forecasting/uplift claim.

---

## 1. Result (binding)

| | Value |
|---|---|
| **cycle-003 `corpus_hash` (CANONICAL — LF / committed-blob)** | `7b6c5b4878025cbf7771bb618861002c777bed9bb5144c004a95fa86c6fd5003` |
| on-disk-CRLF value (NON-CANONICAL Windows checkout artifact — do **not** record as the hash) | `54af7c634e4402e0b0ff5ebc49390481bc8878b045bf3ecdf23fadc0ec006a8c` |
| files hashed | **60** (30 T1 + 30 T2; T4 = 0) |
| tool | `scripts/corona-backtest/reporting/hash-utils.js` → `computeCorpusHash` (existing repo utility, referenced **read-only**) |
| validation control (cycle-001) | `b1caef3faa1d046301229825c40e76e6ea23061a288d15ee6c49e78fbef11bb1` — **reproduced exactly** (25 files) |

The canonical value is recorded in `corpus-cycle-003-manifest.json` top-level `corpus_hash`.

---

## 2. The regime (NOT invented — the existing cycle-001 regime)

The repo already defines exactly one corpus-hash regime, in `scripts/corona-backtest/reporting/hash-utils.js`:

```
computeCorpusHash(corpusDir):
  files = every *.json under corpusDir/<CORPUS_SUBDIRS[theatre]> for theatre in THEATRES   // config.js
        = primary/T1-flare-class, primary/T2-geomag-storm, primary/T3-cme-arrival,
          primary/T4-proton-cascade, primary/T5-solar-wind-divergence
        (non-existent subdirs skipped; non-.json skipped)
  files.sort()                      // by full path
  h = sha256()
  for f in files:
    h.update(relative(corpusDir, f) with '\' -> '/')   // UTF-8 relative path
    h.update(NUL)
    h.update(readFileSync(f))                            // RAW FILE BYTES
    h.update(NUL)
  return h.hex
```

This is the same function and definition cycle-001 used to produce `b1caef3f…11bb1` (see §5 validation). No new hash regime was invented (sprint-plan S06 Task 2 / SDD; the manifest's `corpus_hash_note` CN-2 binding).

### Included / excluded file set

- **Included (60):** `primary/T1-flare-class/*.json` (30) and `primary/T2-geomag-storm/*.json` (30), path-sorted. Because all 60 share the `primary/` prefix and `T1` < `T2`, the order is the 30 T1 files (date-sorted) followed by the 30 T2 files (date-sorted).
- **Excluded:** `corpus-cycle-003-manifest.json`, `README.md`, `heldout-split.json`, `schema/*.json`, `secondary/`, every `.gitkeep`, and the absent/empty `primary/T3-cme-arrival` (absent), `primary/T4-proton-cascade` (present but **0** `.json` — BLOCKED-PARTIAL), `primary/T5-solar-wind-divergence` (absent).

> Because the manifest and `heldout-split.json` are **excluded**, editing them in S06 (manifest reconciliation; the seal was *not* touched) does **not** change `corpus_hash`. Likewise, none of the 60 primary files were edited in S06, so the hash is stable.

---

## 3. EOL hazard (Windows) and why LF is mandatory

`computeCorpusHash` hashes **raw bytes**. This checkout has:

- `git config core.autocrlf` = **`true`**, and **no `.gitattributes`** anywhere.
- Sample: `git ls-files --eol …/T1-2020-05-29-M1p2.json` → `i/lf  w/crlf` — **committed blob = LF, working tree = CRLF**.

So the **on-disk** corpus files carry CRLF, and hashing them directly yields the non-canonical `54af7c63…06a8c`. The frozen cycle-001 `b1caef3f…11bb1` is over **LF** content. Therefore the canonical cycle-003 hash MUST be computed over **LF / committed-blob** bytes. (This matches the S01 verification-ledger note: "the frozen-invariant gate MUST hash committed blobs on Windows checkouts, or normalize EOL.")

> **Do NOT use `git archive` for this on this system.** Empirically, `git archive HEAD:…` here emitted **CRLF** content (all files contained CR; cycle-001 came out as `884d705f…`, not `b1caef3f…`). The authoritative committed-blob bytes come from **`git cat-file blob`** (which reproduced the frozen `17f6380b…` script hash and the cycle-001 `b1caef3f…` corpus hash).

---

## 4. Exact reproduction

Run from the repo root on `cycle-003-s06-closeout` (POSIX shell; Git for Windows / MSYS bash + Windows Node):

```bash
ROOT=$(git rev-parse --show-toplevel)
HU="$ROOT/scripts/corona-backtest/reporting/hash-utils.js"

# Materialize committed (LF) blobs into an ephemeral mirror OUTSIDE the repo, then hash with the repo utility.
hashdir() {                         # $1 = corpus path prefix in HEAD
  local pfx="$1" tmp; tmp=$(mktemp -d)
  git ls-tree -r --name-only HEAD "$pfx" | while IFS= read -r f; do
    rel="${f#"$pfx"/}"; mkdir -p "$tmp/$(dirname "$rel")"
    git cat-file blob "HEAD:$f" > "$tmp/$rel"     # raw blob bytes = LF (no autocrlf smudge)
  done
  HU="$HU" CORPUS="$(cygpath -m "$tmp")" node --input-type=module -e \
    'import {pathToFileURL} from "node:url"; const hu=await import(pathToFileURL(process.env.HU).href); const r=hu.computeCorpusHash(process.env.CORPUS); console.log(r.file_count, r.hex);'
}

hashdir "grimoires/loa/calibration/corona/corpus-cycle-003"   # => 60 7b6c5b48...d5003   (cycle-003)
hashdir "grimoires/loa/calibration/corona/corpus"             # => 25 b1caef3f...11bb1   (cycle-001 control)
```

`cygpath -m` converts the MSYS temp path to a `C:/…` form Node understands; on a non-Windows host drop it and pass `"$tmp"` directly.

**Alternative (LF checkout):** on a host where the working tree is already LF (`core.autocrlf=false`, or a `.gitattributes` forcing LF for these `.json`), `computeCorpusHash` may be run directly against the in-repo corpus dir:

```bash
HU="$HU" CORPUS="$ROOT/grimoires/loa/calibration/corona/corpus-cycle-003" node --input-type=module -e \
  'import {pathToFileURL} from "node:url"; const hu=await import(pathToFileURL(process.env.HU).href); console.log(hu.computeCorpusHash(process.env.CORPUS).hex);'
# => 7b6c5b48...d5003  iff the working tree is LF
```

---

## 5. Validation (the control that makes the value trustworthy)

The pipeline was first run against the **frozen cycle-001 corpus** (`grimoires/loa/calibration/corona/corpus`, 25 primary files) and reproduced the frozen `corpus_hash` **exactly**:

```
cycle-001:  25  b1caef3faa1d046301229825c40e76e6ea23061a288d15ee6c49e78fbef11bb1   ✅ == frozen b1caef3f…11bb1
cycle-003:  60  7b6c5b4878025cbf7771bb618861002c777bed9bb5144c004a95fa86c6fd5003
```

Because the **same utility + same regime + same EOL handling** reproduces the known frozen cycle-001 hash bit-for-bit, the cycle-003 value `7b6c5b48…d5003` is computed by the identical, validated method. The cycle-003 run was repeated (fresh temp mirror) and returned the same value — deterministic. A reliable CR-byte scan over the LF mirror's 60 primary files returned **0** CR bytes.

---

## 6. Distinctness (CN-2, binding)

`7b6c5b48…d5003` is a **distinct value over a distinct file set** (the cycle-003 namespace). It is **never** substituted for, nor compared against, the frozen cycle-001 `corpus_hash b1caef3f…11bb1` as if measuring the same corpus. Any future expanded-corpus baseline computed on this corpus is a **new regime**, never an uplift delta vs Baseline A (cycle-001) or Baseline B (cycle-002) (HAZ-3 / CSG-2). Cycle-003 computes **no** baseline.

---

## 7. Ephemerality / no residue

The temp mirrors were created with `mktemp -d` under the OS temp directory (outside the repo); they hold only copies of already-committed blobs and were used solely to feed the read-only `computeCorpusHash`. No file under `src/`, `scripts/`, `tests/`, or any frozen tree was created, edited, or executed for scoring. The repo working tree carries no residue from the computation.
