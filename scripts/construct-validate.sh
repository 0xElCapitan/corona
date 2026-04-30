#!/usr/bin/env bash
# construct-validate.sh — Local wrapper for v3 construct manifest validation.
#
# Replicates the L0 (sanity) + L1 (schema) checks from
# construct-base/.github/workflows/validate.yml @ b98e9ef. L2 (publish-readiness)
# gates are intentionally omitted for cycle-001 Sprint 0 — deferred to Sprint 7.
# See grimoires/loa/calibration/corona/sprint-0-notes.md for the acquisition
# decision rationale and refresh policy.
#
# Usage:
#   ./scripts/construct-validate.sh [path/to/construct.yaml]
#
# Defaults:
#   manifest: ./construct.yaml at repo root
#   schemas:  ./schemas/{construct,persona,expertise}.schema.{json,yaml}
#
# Exit codes:
#   0 — green (all checks passed)
#   1 — failure (check stderr / stdout for the specific failing check)

set -euo pipefail

MANIFEST="${1:-construct.yaml}"
SCHEMA_DIR="schemas"

if [[ ! -f "$MANIFEST" ]]; then
  echo "ERROR: manifest not found: $MANIFEST" >&2
  exit 1
fi

if ! command -v yq >/dev/null 2>&1; then
  echo "ERROR: yq is required (https://github.com/mikefarah/yq, v4+)" >&2
  exit 1
fi

if ! command -v ajv >/dev/null 2>&1; then
  echo "ERROR: ajv is required (npm i -g ajv-cli ajv-formats)" >&2
  exit 1
fi

errors=0

# --- L0: yq parse -----------------------------------------------------------
if ! yq eval '.' "$MANIFEST" > /dev/null 2>&1; then
  echo "ERROR: $MANIFEST is not valid YAML" >&2
  exit 1
fi

# --- L0: required fields ----------------------------------------------------
for field in schema_version name slug version description; do
  val=$(yq ".$field" "$MANIFEST")
  if [[ "$val" == "null" || -z "$val" ]]; then
    echo "ERROR: missing required field: $field" >&2
    errors=$((errors + 1))
  fi
done

# --- L0: schema_version must equal 3 ----------------------------------------
sv=$(yq ".schema_version" "$MANIFEST")
if [[ "$sv" != "3" ]]; then
  echo "ERROR: schema_version must be 3 (got: $sv)" >&2
  errors=$((errors + 1))
fi

# --- L0: reject placeholder strings -----------------------------------------
placeholders=("TODO:" "your-name" "your-org" "example-skill" "My Construct" "A brief description of what this construct does")
for placeholder in "${placeholders[@]}"; do
  for field in name slug description author; do
    val=$(yq ".$field" "$MANIFEST")
    if [[ "$val" == *"$placeholder"* ]]; then
      echo "ERROR: placeholder '$placeholder' found in field '$field'" >&2
      errors=$((errors + 1))
    fi
  done
done

# --- L0/L1: validate skill directories (matches upstream validate.yml:107-329) ----
# Tightened cycle-001 Sprint 0 hotfix per operator review: lax WARN replaced
# with upstream-equivalent ERROR checks so local runs catch the same drift CI
# would catch.
skill_count=$(yq '.skills | length' "$MANIFEST")
if [[ "$skill_count" != "null" && "$skill_count" -gt 0 ]]; then
  for i in $(seq 0 $((skill_count - 1))); do
    slug=$(yq ".skills[$i].slug" "$MANIFEST")
    path=$(yq ".skills[$i].path" "$MANIFEST")

    # Reject path traversal / absolute paths
    if [[ "$path" == *".."* || "$path" == /* ]]; then
      echo "ERROR: skill '$slug' has path traversal or absolute path: $path" >&2
      errors=$((errors + 1))
      continue
    fi

    # Skill directory MUST exist (upstream L0)
    if [[ ! -d "$path" ]]; then
      echo "ERROR: skill directory not found: $path (slug: $slug)" >&2
      errors=$((errors + 1))
      continue
    fi

    # SKILL.md must exist and have ≥15 lines (upstream L0)
    if [[ ! -f "$path/SKILL.md" ]]; then
      echo "ERROR: missing SKILL.md for skill: $slug (expected at $path/SKILL.md)" >&2
      errors=$((errors + 1))
    else
      line_count=$(wc -l < "$path/SKILL.md")
      if [[ "$line_count" -lt 15 ]]; then
        echo "ERROR: SKILL.md for $slug is only $line_count lines (minimum 15)" >&2
        errors=$((errors + 1))
      fi

      # L1: SKILL.md must have required sections (Trigger / Workflow / Boundaries)
      for section in Trigger Workflow Boundaries; do
        if ! grep -qE "^##\s+.*${section}" "$path/SKILL.md"; then
          echo "ERROR: SKILL.md for $slug missing required section: ## $section" >&2
          errors=$((errors + 1))
        fi
      done
    fi

    # index.yaml must exist (upstream L0)
    if [[ ! -f "$path/index.yaml" ]]; then
      echo "ERROR: missing index.yaml for skill: $slug (expected at $path/index.yaml)" >&2
      errors=$((errors + 1))
    else
      # L1: capabilities block must declare model_tier, danger_level, effort_hint, execution_hint
      for cap in model_tier danger_level effort_hint execution_hint; do
        cap_val=$(yq ".capabilities.$cap" "$path/index.yaml")
        if [[ "$cap_val" == "null" || -z "$cap_val" ]]; then
          echo "ERROR: skill $slug missing capabilities.$cap in index.yaml" >&2
          errors=$((errors + 1))
        fi
      done

      # L1: enum-restricted capability values
      tier=$(yq '.capabilities.model_tier' "$path/index.yaml")
      if [[ "$tier" != "null" ]] && ! echo "sonnet opus haiku" | grep -qw "$tier"; then
        echo "ERROR: skill $slug: capabilities.model_tier must be sonnet|opus|haiku (got: $tier)" >&2
        errors=$((errors + 1))
      fi

      danger=$(yq '.capabilities.danger_level' "$path/index.yaml")
      if [[ "$danger" != "null" ]] && ! echo "safe moderate high critical" | grep -qw "$danger"; then
        echo "ERROR: skill $slug: capabilities.danger_level must be safe|moderate|high|critical (got: $danger)" >&2
        errors=$((errors + 1))
      fi

      effort=$(yq '.capabilities.effort_hint' "$path/index.yaml")
      if [[ "$effort" != "null" ]] && ! echo "small medium large" | grep -qw "$effort"; then
        echo "ERROR: skill $slug: capabilities.effort_hint must be small|medium|large (got: $effort)" >&2
        errors=$((errors + 1))
      fi

      exec_hint=$(yq '.capabilities.execution_hint' "$path/index.yaml")
      if [[ "$exec_hint" != "null" ]] && ! echo "parallel sequential" | grep -qw "$exec_hint"; then
        echo "ERROR: skill $slug: capabilities.execution_hint must be parallel|sequential (got: $exec_hint)" >&2
        errors=$((errors + 1))
      fi
    fi
  done
fi

# --- L1: ajv schema validation ----------------------------------------------
if [[ -f "$SCHEMA_DIR/construct.schema.json" ]]; then
  tmp=$(mktemp -t construct-XXXXXX.json)
  trap 'rm -f "$tmp"' EXIT

  if ! yq -o=json "$MANIFEST" > "$tmp"; then
    echo "ERROR: yq failed to convert $MANIFEST to JSON" >&2
    errors=$((errors + 1))
  # Note: --validate-formats=false skips format-keyword checks (uri, email, date-time, etc.)
  # because ajv-formats is not installed locally. Full upstream CI invokes
  # `ajv-cli ajv-formats` together for complete format validation. Structural
  # schema validation (required fields, types, patterns, enum values) is unaffected.
  # See grimoires/loa/calibration/corona/sprint-0-notes.md for the gap rationale.
  elif ! ajv validate -s "$SCHEMA_DIR/construct.schema.json" -d "$tmp" --spec=draft2020 --validate-formats=false >&2; then
    echo "ERROR: $MANIFEST does not conform to $SCHEMA_DIR/construct.schema.json" >&2
    errors=$((errors + 1))
  fi

  # Validate persona.yaml if declared
  persona_path=$(yq '.identity.persona' "$MANIFEST")
  if [[ "$persona_path" != "null" && -n "$persona_path" ]]; then
    if [[ "$persona_path" == *".."* || "$persona_path" == /* ]]; then
      echo "ERROR: identity.persona has path traversal or absolute path: $persona_path" >&2
      errors=$((errors + 1))
    elif [[ ! -f "$persona_path" ]]; then
      echo "ERROR: persona file not found: $persona_path" >&2
      errors=$((errors + 1))
    elif [[ -f "$SCHEMA_DIR/persona.schema.yaml" ]]; then
      tmp2=$(mktemp -t persona-XXXXXX.json)
      yq -o=json "$persona_path" > "$tmp2"
      if ! ajv validate -s "$SCHEMA_DIR/persona.schema.yaml" -d "$tmp2" --spec=draft2020 --validate-formats=false >&2; then
        echo "ERROR: $persona_path does not conform to $SCHEMA_DIR/persona.schema.yaml" >&2
        errors=$((errors + 1))
      fi
      rm -f "$tmp2"
    fi
  fi
else
  echo "WARN: $SCHEMA_DIR/construct.schema.json not found — skipping L1 schema validation" >&2
fi

# --- Summary ----------------------------------------------------------------
if [[ $errors -gt 0 ]]; then
  echo "FAIL: $errors error(s) — $MANIFEST is not v3-conformant" >&2
  exit 1
fi
echo "OK: $MANIFEST conforms to v3 (schemas/construct.schema.json @ b98e9ef)"
