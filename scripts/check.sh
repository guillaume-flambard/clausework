#!/usr/bin/env bash
# Clausework structural invariants. Run from the repository root.
set -uo pipefail
fail=0
ok()   { printf 'ok   %s\n' "$1"; }
bad()  { printf 'FAIL %s\n' "$1"; fail=1; }

# 1. No em dash or en dash in shipped markdown.
# Files are enumerated through git, never by walking the filesystem: git-ignored
# scratch quotes these characters by necessity and must never be scanned.
# --cached --others --exclude-standard covers tracked files AND new untracked
# files while honouring .gitignore, which is exactly the set that can ship.
# scripts/ and docs/superpowers/plans/ are exempt by path prefix: they must quote
# the forbidden characters in order to forbid them.
dash_scan() {
  local files
  files=$(git ls-files --cached --others --exclude-standard -- '*.md' '*.json' \
    | grep -v -e '^scripts/' -e '^docs/superpowers/plans/')
  [ -z "$files" ] && return 0
  printf '%s\n' "$files" | tr '\n' '\0' \
    | xargs -0 grep -HIn -e $'—' -e $'–' -e '&mdash;' -e '&ndash;' 2>/dev/null
}
if [ -n "$(dash_scan)" ]; then
  bad "dash: em or en dash found"
  dash_scan | head -20
else
  ok "dash: no em or en dash"
fi

# 2. Every contract file exists and has a matching cases file.
missing=0
for c in request trigger idempotency impact; do
  [ -f "method/contracts/$c.md" ] || { bad "contract: method/contracts/$c.md missing"; missing=1; }
  [ -f "method/cases/$c-cases.md" ] || { bad "cases: method/cases/$c-cases.md missing"; missing=1; }
done
[ "$missing" -eq 0 ] && ok "contracts: four contracts, four case files"

# 2b. The six mandatory test cases are documented.
if [ -f method/testing.md ]; then
  missing_cases=0
  for c in nominal replay peak "broken data" "zero items" cap; do
    grep -qi "^| $c " method/testing.md \
      || { bad "testing: case '$c' missing from method/testing.md"; missing_cases=1; }
  done
  [ "$missing_cases" -eq 0 ] && ok "testing: six mandatory cases documented"
else
  bad "testing: method/testing.md missing"
fi

# 3. Every refusal rule declared in gates.md has both examples in its cases file.
if [ -f method/gates.md ]; then
  rules=$(grep -oE '^\| (R[1-5]|T[1-4]|I[1-5]|M[1-5]) ' method/gates.md | tr -d '| ' | sort -u)
  n=$(printf '%s\n' "$rules" | grep -c . )
  if [ "$n" -gt 19 ]; then
    bad "cap: $n rules in gates.md, ceiling is 19 (see docs/decisions.md)"
  else
    ok "cap: $n rules, ceiling 19"
  fi
  for r in $rules; do
    case "$r" in
      R*) f=method/cases/request-cases.md ;;
      T*) f=method/cases/trigger-cases.md ;;
      I*) f=method/cases/idempotency-cases.md ;;
      M*) f=method/cases/impact-cases.md ;;
    esac
    passes=$(grep -c "^### $r passes" "$f" 2>/dev/null || echo 0)
    refuses=$(grep -c "^### $r refuses" "$f" 2>/dev/null || echo 0)
    if [ "$passes" -eq 1 ] && [ "$refuses" -eq 1 ]; then
      ok "rule $r: both examples present"
    else
      bad "rule $r: needs one '### $r passes' and one '### $r refuses' in $f"
    fi
  done
else
  bad "gates: method/gates.md missing"
fi

# 4. Every registry entry carries its seven files.
for d in registry/*/; do
  [ "$d" = 'registry/*/' ] && continue
  for f in README.md request.md trigger.md idempotency.md impact.md flow-spec.md runbook.md; do
    [ -f "$d$f" ] || bad "registry: $d$f missing"
  done
  grep -q '^workflow_id:' "$d/README.md" 2>/dev/null \
    || bad "anchor: $d/README.md has no workflow_id header field"
done

exit $fail
