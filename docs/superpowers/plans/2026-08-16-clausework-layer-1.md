# Clausework Layer 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the readable core of Clausework, meaning a method that works with no tooling installed, plus a working n8n intake form and one real automation traversed end to end.

**Architecture:** Markdown is the product. `scripts/check.sh` is the test harness: it enforces the structural invariants of the method (every contract has its case file, the blocking rules file stays capped, every registry entry carries its seven files, no em dash anywhere). Every content task is written test first, meaning the case pairs before the rule text. The only executable artifact is the n8n intake workflow, tested through the n8n MCP server.

**Tech Stack:** Markdown, bash (POSIX, no dependency beyond grep and find), n8n (Form Trigger 2.6, Form 2.5, GitHub node 1.1, Data Table), n8n MCP server for validation.

**Spec:** `docs/superpowers/specs/2026-08-16-clausework-design.md`

## Global Constraints

- **Layer 2 must stand alone.** No task may make the method require an agent, an MCP server or an n8n instance to be read and applied. The intake form is a convenience, never a prerequisite. Spec section 4.
- **Zero em dash and zero en dash** in any file, including the characters `—` and `–` and the entities `&mdash;` and `&ndash;`. Enforced by `scripts/check.sh`.
- **English only** for structure, filenames and method content. French appears only in `intake/locales/fr.md`. Spec section 10.
- **The blocking rules file is capped at 19 rules.** Five R, four T, five I, five M. Adding one requires removing one or writing why in `docs/decisions.md`. Spec section 8.
- **No node configuration guidance.** Anything about how to configure an n8n node is delegated to the n8n MCP skills and must be referenced, not restated. Spec section 2.
- **Commit messages carry no AI co-author trailer.**
- Deadline: layer 1 complete before 2026-08-20.

## Resolved before planning

Four items were open in spec section 12. Three are now answered and their answers are binding on the tasks below.

1. **Silent failure threshold.** Source: `~/Vault/03-Technologies/n8n Zero-Item Silent Failure.md`, observed on self-hosted n8n 2.29.10 on 2026-07-16. A node returning zero items is not an error: the chain is skipped and the execution is marked `success`. **An error workflow never fires on it.** The observable signal is execution duration collapsing by orders of magnitude (4m30s against 63ms). The only prevention is an explicit guard that throws. This changes the runbook template: it must declare both an expected item count and an expected duration floor, and the method must require a guard node rather than an alert. Task 6.
2. **Live validation in the form.** Possible. `n8n-nodes-base.formTrigger` v2.6 starts the form, `n8n-nodes-base.form` v2.5 with `operation: page` adds steps, and official best practice describes routing back to the faulty step with an error message using IF or Switch. Two obligations follow: set "Append n8n Attribution" to false, and persist the raw response in a real storage node (Data Table preferred) because Set and Merge do not persist. Task 8.
3. **Writing into the registry.** `n8n-nodes-base.github` exposes `resource: file, operation: create`. The intake workflow commits `request.md` directly. Task 8.
4. **n8n Source Control and Environments documentation: still unread.** It does not block layer 1, since layer 1 does not use git as the source of truth for workflow JSON. It stays open and must be read before layer 3 is designed for real. Do not silently assume behaviour from it in any task.

---

## File structure

| Path | Responsibility |
|---|---|
| `scripts/check.sh` | The test harness. Structural invariants of the whole repo. |
| `README.md` | What Clausework is, who it is for, in two minutes. |
| `AGENTS.md` | Agent contract, model agnostic. |
| `CLAUDE.md` | Thin include of AGENTS.md. |
| `LICENSE` | MIT. |
| `method/overview.md` | The eight steps and the four gates, one page. |
| `method/gates.md` | Every blocking rule, one place, capped at 19. |
| `method/testing.md` | The six mandatory test cases, and the one rule with no relief valve. |
| `method/contracts/request.md` | Contract 1 fields and refusal rules R1 to R5. |
| `method/contracts/trigger.md` | Contract 2 fields and refusal rules T1 to T4. |
| `method/contracts/idempotency.md` | Contract 3 fields and refusal rules I1 to I5. |
| `method/contracts/impact.md` | Contract 4 fields and refusal rules M1 to M5. |
| `method/cases/request-cases.md` | One passing and one refused example per R rule. |
| `method/cases/trigger-cases.md` | Same for T rules. |
| `method/cases/idempotency-cases.md` | Same for I rules. |
| `method/cases/impact-cases.md` | Same for M rules. |
| `method/templates/flow-spec.md` | Testable step template. |
| `method/templates/runbook.md` | Runbook template, derived from the contracts. |
| `intake/workflow.json` | The request form as an n8n workflow. |
| `intake/locales/fr.md` | French labels. |
| `intake/README.md` | How to install it on your own instance. |
| `registry/README.md` | What a registry entry is, and the anchor convention. |
| `registry/job-market-multi-source-scan/` | The real traversed case. |
| `examples/crm-lead-enrichment/` | The illustrative sketched case. |
| `docs/decisions.md` | The repository log, including every rule cap exception. |

`method/cases/` is a refinement on spec section 10, which named the case files without placing them. Everything else matches the spec layout exactly.

---

### Task 1: The test harness and the skeleton

**Files:**
- Create: `scripts/check.sh`
- Create: `README.md`, `AGENTS.md`, `CLAUDE.md`, `LICENSE`, `docs/decisions.md`
- Create: directory placeholders `method/contracts/`, `method/cases/`, `method/templates/`, `intake/locales/`, `registry/`, `examples/`

**Interfaces:**
- Consumes: nothing.
- Produces: `scripts/check.sh`, runnable as `bash scripts/check.sh` from the repository root. Exit code 0 means all invariants hold, 1 means at least one failed. Every later task ends by running it. It prints one line per check, prefixed `ok` or `FAIL`.

- [ ] **Step 1: Write the failing test**

Create `scripts/check.sh`:

```bash
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
  git rev-parse --git-dir >/dev/null 2>&1 || { bad "git: not a git repository, cannot enumerate files"; exit 1; }
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

# 2c. Case files carry both worked examples per rule, as soon as they exist.
# Independent of gates.md, so a heading-format drift fails in the task that
# introduces it rather than four tasks later.
check_cases() {
  local file="$1"; shift
  [ -f "$file" ] || return 0
  local r miss=0
  for r in "$@"; do
    [ "$(grep -c "^### $r passes$" "$file")" -eq 1 ] \
      || { bad "cases: $file needs exactly one '### $r passes'"; miss=1; }
    [ "$(grep -c "^### $r refuses$" "$file")" -eq 1 ] \
      || { bad "cases: $file needs exactly one '### $r refuses'"; miss=1; }
  done
  [ "$miss" -eq 0 ] && ok "cases: $file headings well formed"
}
check_cases method/cases/request-cases.md R1 R2 R3 R4 R5
check_cases method/cases/trigger-cases.md T1 T2 T3 T4
check_cases method/cases/idempotency-cases.md I1 I2 I3 I4 I5
check_cases method/cases/impact-cases.md M1 M2 M3 M4 M5

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
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `bash scripts/check.sh; echo "exit=$?"`
Expected: FAIL lines for the missing contracts, cases and `method/gates.md`, and `exit=1`.

- [ ] **Step 3: Write the minimal content to make the structural part pass**

Create the directories and the root files. `README.md` must answer, in this order and in under 60 lines: what Clausework is (an engineering method for n8n automations built on four contracts that can refuse), who the two audiences are, what it is not (no node configuration guidance, no BMAD dependency), how to start with no tooling (read `method/overview.md`, copy the templates), and where the intake form lives.

`AGENTS.md` must state: read `method/overview.md` and `method/gates.md` before touching a registry entry; never invent a contract answer on behalf of a requester; node configuration questions go to the n8n MCP skills; run `bash scripts/check.sh` before every commit.

`CLAUDE.md` contains exactly one line: `@AGENTS.md`.

`docs/decisions.md` starts with one entry dated 2026-08-16 recording the 19 rule cap and where it comes from.

`LICENSE` is MIT, copyright Guillaume Flambard, 2026.

- [ ] **Step 4: Run it again**

Run: `bash scripts/check.sh; echo "exit=$?"`
Expected: the dash check passes, the contract and cases checks still FAIL (they are filled in tasks 2 to 5), `exit=1`. This is correct at this stage.

- [ ] **Step 5: Commit**

```bash
git add scripts README.md AGENTS.md CLAUDE.md LICENSE docs/decisions.md
git commit -m "chore: repository skeleton and structural check script"
```

---

### Task 2: Contract 1, the request

**Files:**
- Create: `method/cases/request-cases.md`
- Create: `method/contracts/request.md`
- Test: `bash scripts/check.sh`

**Interfaces:**
- Consumes: `scripts/check.sh` from task 1.
- Produces: rule identifiers `R1` to `R5`, used verbatim by `method/gates.md` in task 6 and by the intake workflow in task 8. The seven field names of contract 1, which task 8 turns into form fields and task 7 fills with real data: `owner`, `trigger_sentence`, `today_manual`, `success_observable`, `never_happens`, `systems`, `deadline_reason`.

- [ ] **Step 1: Write the failing test**

Create `method/cases/request-cases.md`. Each rule gets exactly two sections, headed `### R1 passes` and `### R1 refuses`, and so on through R5. Each section holds a concrete filled-in fragment plus one line saying why it passes or what question the refusal sends back. Refusals return the missing question, never a wall (spec section 6).

Write the ten sections using the rule definitions in spec section 6, contract 1. Use realistic Sales and Customer Success material, since those are the requesters.

- [ ] **Step 2: Run the check to verify it fails**

Run: `bash scripts/check.sh 2>&1 | grep -E 'rule R|contract'`
Expected: FAIL on `method/contracts/request.md` missing, and the R rules not yet found because `method/gates.md` does not exist. The case file alone does not satisfy the check.

- [ ] **Step 3: Write the contract**

Create `method/contracts/request.md`: the seven fields with a one line definition each, then the R1 to R5 table copied from spec section 6, then a filled example, then a line stating that the front door stops at these five questions and everything else belongs to scoping.

- [ ] **Step 4: Run the check**

Run: `bash scripts/check.sh 2>&1 | grep -E 'dash|contract'`
Expected: the dash check passes and `method/contracts/request.md` no longer appears as missing. R rule checks still fail until task 6 creates `gates.md`.

- [ ] **Step 5: Commit**

```bash
git add method/contracts/request.md method/cases/request-cases.md
git commit -m "feat: contract 1, the request, with R1 to R5 and their case pairs"
```

---

### Task 3: Contract 2, the trigger

**Files:**
- Create: `method/cases/trigger-cases.md`
- Create: `method/contracts/trigger.md`
- Test: `bash scripts/check.sh`

**Interfaces:**
- Consumes: `scripts/check.sh`.
- Produces: rule identifiers `T1` to `T4`. Field names used by tasks 6, 7 and 9: `trigger_type`, `system_of_record`, `volume_normal`, `volume_peak`, `peak_cause`, `latency`, `replay_behaviour`, `catch_up_window`, `order_matters`, and `cursor_field` (conditional, required for polling triggers only). `replay_behaviour` and `volume_peak` are consumed directly by the test table in task 6, so their names must not drift.

- [ ] **Step 1: Write the failing test**

Create `method/cases/trigger-cases.md` with eight sections, `### T1 passes` through `### T4 refuses`, from spec section 6, contract 2. T3 and T4 must use concrete n8n situations: a webhook with no catch up, and a polling trigger with no named cursor field.

- [ ] **Step 2: Run the check to verify it fails**

Run: `bash scripts/check.sh 2>&1 | grep -E 'rule T|contract'`
Expected: FAIL, `method/contracts/trigger.md` missing.

- [ ] **Step 3: Write the contract**

Create `method/contracts/trigger.md`: the nine fields, the T1 to T4 table from spec section 6, and one filled example. State explicitly that `volume_peak` and `replay_behaviour` feed two of the six mandatory test cases, so leaving them thin costs coverage later.

- [ ] **Step 4: Run the check**

Run: `bash scripts/check.sh 2>&1 | grep -E 'dash|contract'`
Expected: dash check passes, trigger contract no longer missing.

- [ ] **Step 5: Commit**

```bash
git add method/contracts/trigger.md method/cases/trigger-cases.md
git commit -m "feat: contract 2, the trigger, with T1 to T4 and their case pairs"
```

---

### Task 4: Contract 3, idempotency and effects

**Files:**
- Create: `method/cases/idempotency-cases.md`
- Create: `method/contracts/idempotency.md`
- Test: `bash scripts/check.sh`

**Interfaces:**
- Consumes: `scripts/check.sh`, and the field `replay_behaviour` from task 3.
- Produces: rule identifiers `I1` to `I5`. Field names: `dedup_key`, `dedup_state_store`, `effects` (a table with columns `node`, `system`, `reversible`, `customer_visible`), `effect_order`, `resume_point`, `recovery_strategy`, `safety_cap`. Task 6 derives the cap test case from `safety_cap` and the broken data case from `effects`.

- [ ] **Step 1: Write the failing test**

Create `method/cases/idempotency-cases.md` with ten sections from spec section 6, contract 3.

Two of them carry the weight of the whole method and must be unambiguous:

`### I4 refuses` must show a flow that sends mail with no `safety_cap`, and state the consequence in the words of the spec: this is what prevents 4000 emails at 3am.

`### I3 refuses` must show an effect table where an irreversible effect is ordered before a reversible one, and state that the resolution is reordering, not an exception.

- [ ] **Step 2: Run the check to verify it fails**

Run: `bash scripts/check.sh 2>&1 | grep -E 'rule I|contract'`
Expected: FAIL, `method/contracts/idempotency.md` missing.

- [ ] **Step 3: Write the contract**

Create `method/contracts/idempotency.md`: the seven fields, the effect inventory table shape, the I1 to I5 table from spec section 6, and one filled example.

It must carry two statements verbatim from the spec, because everything downstream leans on them:
- This is the only contract that blocks production release. The others block the next step.
- Automatic replay is forbidden on any flow carrying an irreversible effect.

I5 must point at the `n8n-error-handling` skill for the how, and must not restate it.

- [ ] **Step 4: Run the check**

Run: `bash scripts/check.sh 2>&1 | grep -E 'dash|contract'`
Expected: dash check passes, idempotency contract no longer missing.

- [ ] **Step 5: Commit**

```bash
git add method/contracts/idempotency.md method/cases/idempotency-cases.md
git commit -m "feat: contract 3, idempotency and effects, the only release blocking contract"
```

---

### Task 5: Contract 4, impact

**Files:**
- Create: `method/cases/impact-cases.md`
- Create: `method/contracts/impact.md`
- Test: `bash scripts/check.sh`

**Interfaces:**
- Consumes: `scripts/check.sh`.
- Produces: rule identifiers `M1` to `M5`. Field names: `measure`, `before_value`, `before_source`, `before_date`, `before_estimated` (boolean), `target_value`, `read_back_method`, `read_back_date`, `read_back_owner`, `abandon_condition`. Task 7 fills these with figures measured from a live pipeline.

- [ ] **Step 1: Write the failing test**

Create `method/cases/impact-cases.md` with ten sections from spec section 6, contract 4.

`### M2 passes` is the subtle one: an estimated before value is tolerated, but it sets `before_estimated: true` and that flag must surface in the read back. Show both the field and the consequence.

`### M5 refuses` must show a request with no abandon condition and state the reason: an automation nobody can switch off becomes permanent debt.

- [ ] **Step 2: Run the check to verify it fails**

Run: `bash scripts/check.sh 2>&1 | grep -E 'rule M|contract'`
Expected: FAIL, `method/contracts/impact.md` missing.

- [ ] **Step 3: Write the contract**

Create `method/contracts/impact.md`: the ten fields, the M1 to M5 table from spec section 6, and one filled example.

It must open by stating why the contract is filled at step 2 and not later: it belongs to the requester, and that is the only moment the before value still exists. Measuring afterwards never works.

- [ ] **Step 4: Run the check**

Run: `bash scripts/check.sh 2>&1 | grep -E 'dash|contract'`
Expected: dash check passes, all four contracts and all four case files present.

- [ ] **Step 5: Commit**

```bash
git add method/contracts/impact.md method/cases/impact-cases.md
git commit -m "feat: contract 4, impact, filled before the build and read back after"
```

---

### Task 6: The gates file, the templates, and the first fully green check

**Files:**
- Create: `method/gates.md`
- Create: `method/overview.md`
- Create: `method/testing.md`
- Create: `method/templates/flow-spec.md`
- Create: `method/templates/runbook.md`
- Test: `bash scripts/check.sh`

**Interfaces:**
- Consumes: rule identifiers R1 to R5, T1 to T4, I1 to I5, M1 to M5 from tasks 2 to 5, and every field name they produced.
- Produces: `method/gates.md` in the exact row format `| R1 | ... |` that `scripts/check.sh` greps. The runbook template, consumed by task 7 and by every future automation.

- [ ] **Step 1: Write the failing test**

The test already exists: `scripts/check.sh` check 3 counts rules in `method/gates.md` and demands both examples for each. It currently fails because the file is absent.

Run: `bash scripts/check.sh 2>&1 | grep gates`
Expected: `FAIL gates: method/gates.md missing`

- [ ] **Step 2: Write the gates file**

Create `method/gates.md`. One table, 19 rows, in the order R1 to R5, T1 to T4, I1 to I5, M1 to M5. Each row: the identifier, what it refuses, and the question the refusal returns.

The row format must start the line with `| R1 ` and so on, because that is what the check greps.

Below the table, three sections:
- **The relief valve.** Forcing a gate is allowed. It writes one line into the automation log: who forced it, why, and the review date. A method that cannot be bypassed gets bypassed from the outside, and then the trace is lost.
- **The cap.** Nineteen rules. Adding one requires removing one, or an entry in `docs/decisions.md`.
- **The one rule with no relief valve.** Never test a customer effecting flow against production without switching its irreversible effects off. Spec section 9.

- [ ] **Step 3: Write the overview, the testing file and the two templates**

`method/overview.md`: the eight step table from spec section 7, the three layer model from spec section 4, and the anchor convention from spec section 5.

`method/testing.md` carries the six mandatory test cases from spec section 9, as a table whose first column starts each row with `| nominal `, `| replay `, `| peak `, `| broken data `, `| zero items `, `| cap `, because that is what `scripts/check.sh` check 2b greps. Columns: case, derived from, must produce.

It must open on the point that makes the contracts worth filling: **if the contracts are filled, the test plan already exists.** Nobody decides what to test, and nobody has to remember to.

It must also carry, as its own section, the rule with no relief valve: never test a customer effecting flow against production without switching its irreversible effects off. The two accepted mechanisms are a dry run flag or sandbox credentials, and the contract 3 effect inventory already names exactly what to switch.

Then the business acceptance section: the owner validates on three real cases they choose themselves. An automation passing all six technical cases and failing here is not ready.

In layer 1 the table is filled by hand from the contracts. Deriving it automatically is layer 2, and saying so here stops a reader expecting a generator that does not exist yet.

`method/templates/flow-spec.md`: a step template with, per step, the expected input, the expected output, and the side effects it triggers if any. The cut into testable steps is what makes validation possible.

`method/templates/runbook.md`: derived entirely from the contracts, inventing nothing. It carries the three failure classes from spec section 8 (transient, data, partial effect) with their different treatments, the effect inventory copied from contract 3, the resume point, the safety cap, and the escalation path.

Its zero item section is where the resolved finding lands, and it must be explicit rather than generic:

```markdown
## Silent failure guard

A node returning zero items is not an error in n8n. The chain downstream is
skipped and the execution is written as `success`. An error workflow never
fires on it.

Expected item count: <n per run>
Expected duration floor: <seconds>

Duration is the real health signal. On a documented case, a working run took
4m30s and the broken run took 63ms, both green, for five days.

Guard node, required after any node that can legitimately emit nothing
(file reads, filters, IF branches, HTTP calls with empty results, database
queries with no rows):

    if ($input.all().length === 0) {
      throw new Error('<flow name>: <source> produced zero items');
    }

Turning silence into a real error is what makes the alerting chain work at all.
```

Source for that section: `~/Vault/03-Technologies/n8n Zero-Item Silent Failure.md`, observed on n8n 2.29.10 on 2026-07-16.

- [ ] **Step 4: Run the check, expect it fully green**

Run: `bash scripts/check.sh; echo "exit=$?"`
Expected: every line prefixed `ok`, including `cap: 19 rules, ceiling 19` and one `rule Xn: both examples present` per rule, and `exit=0`.

If any rule reports a missing example, the fault is in the case file heading, which must read exactly `### R1 passes` and `### R1 refuses`.

- [ ] **Step 5: Commit**

```bash
git add method/gates.md method/overview.md method/templates
git commit -m "feat: gates file, overview and templates, structural check now green"
```

---

### Task 7: The real traversed case, a multi source scanning pipeline

**Files:**
- Create: `registry/README.md`
- Create: `registry/job-market-multi-source-scan/README.md`
- Create: `registry/job-market-multi-source-scan/{request,trigger,idempotency,impact,flow-spec,runbook}.md`
- Test: `bash scripts/check.sh`

**Interfaces:**
- Consumes: every contract and template from tasks 2 to 6.
- Produces: the reference entry that `examples/` and the README point at, and the shape every future entry copies.

**Why this case:** it is real, it runs daily, and **it failed in exactly the way contract 3 exists to prevent.** A pipeline scans 45 distinct sources into one store, deduplicated by nothing. Measured 2026-08-16: 3004 rows for 2022 distinct organisations, so 982 duplicate rows, a third of the table. 432 organisations appear more than once, one from seven separate sources. Eighty rows sit in a `new` state while the same organisation already carries a row that was acted on.

A success story would have made every refusal rule abstract. This one lets each rule point at what its own absence cost, with a number attached. Spec section 11.

**Privacy, binding on every file in this entry:** publish mechanics, never identities. Volumetrics, duplicate rates and failure counts are real and go in. Organisation names, item statuses, dates and any personal identifier do not, and no row level data is committed. The teaching value is in the failure mode, not in which organisations appeared. A single leaked organisation name is a defect, not a detail.

- [ ] **Step 1: Write the failing test**

The test exists: `scripts/check.sh` check 4 demands seven files per registry entry plus a `workflow_id:` header field.

Run: `mkdir -p registry/job-market-multi-source-scan && bash scripts/check.sh 2>&1 | grep registry`
Expected: seven FAIL lines, one per missing file, plus the anchor FAIL.

- [ ] **Step 2: Write the registry README**

`registry/README.md` explains: one automation is one directory, the seven files, and the anchor. The anchor is the load bearing part and must be stated as a rule, not a suggestion: every workflow carries the n8n tag `reg:<slug>`, every entry header carries `workflow_id`, and **any workflow without a `reg:` tag is by definition out of process.**

It also carries the two rules that keep an entry from going stale, from spec section 8:
- Every entry header carries a review date. Volumes double and effect inventories do not follow on their own.
- **Adding a side effecting node reopens contract 3.** Not a suggestion either: the effect inventory is what the release gate and two of the six test cases read from, so an inventory that lags is a gate that has stopped working.

- [ ] **Step 3: Fill the four contracts with the measured figures**

These figures were measured on 2026-08-16 against the live store. Use them verbatim. Do not invent, round or embellish any of them, and do not go looking for more in the source system: everything publishable is already here.

- 45 distinct sources feeding one pipeline
- 3004 rows, 2022 distinct organisations, so 982 duplicate rows, 33 percent of the table
- 432 organisations appear more than once
- one organisation resurfaced from 7 distinct sources, another from 6, one appeared 36 times
- 80 rows in a `new` state while the same organisation already carries a row that was acted on

The contract 3 story is that the deduplication key is absent: nothing reconciles the same organisation across sources, so the same one arrives repeatedly as if it had never been seen. The 80 count is that failure, quantified.

The contract 4 before value is measurable rather than estimated, so `before_estimated` is `false` here. Say so, and note in the entry that this is the uncommon case: rule M2 exists because most before values are estimates.

If a field genuinely has no measured answer, set `before_estimated: true` per rule M2 rather than inventing a number. That is what the flag exists for.

- [ ] **Step 4: Write the flow spec, the runbook and the entry README, then run the check**

The entry `README.md` header carries `status`, `owner`, `workflow_id`, key dates, forced gates, and the decision log in its body.

Run: `bash scripts/check.sh; echo "exit=$?"`
Expected: all `ok`, `exit=0`.

- [ ] **Step 5: Commit**

```bash
git add registry
git commit -m "docs: multi source scanning pipeline traversed end to end"
```

---

### Task 8: The intake workflow

**Files:**
- Create: `intake/workflow.json`
- Create: `intake/locales/fr.md`
- Create: `intake/README.md`
- Test: n8n MCP `validate_workflow`, then `test_workflow`

**Interfaces:**
- Consumes: the seven contract 1 field names from task 2 and the rules R1 to R5 from task 6.
- Produces: a workflow that writes `registry/<slug>/request.md` into the repository and stores the raw response.

**Binding findings from the research pass:**
- `n8n-nodes-base.formTrigger` v2.6 starts the form. `n8n-nodes-base.form` v2.5 with `operation: page` adds each step, and `operation: completion` ends it.
- Validation between steps routes back to the faulty step with an error message, using IF or Switch. This is how R1 to R5 are applied live rather than after submission.
- "Append n8n Attribution" must be set to false.
- The raw response must be persisted in a real storage node. Data Table is preferred. Set and Merge do not persist and are not sufficient.
- `n8n-nodes-base.github` with `resource: file, operation: create` writes the file into the repository.

- [ ] **Step 1: Read the SDK reference and the exact type definitions**

Do not guess parameter names. In order:
1. `get_sdk_reference`
2. `get_workflow_best_practices` with `technique: "form_input"`
3. `search_nodes` with `["form trigger", "form", "github", "if", "data table"]`
4. `get_node_types` for every node you will use, with discriminators, including `{ nodeId: "n8n-nodes-base.form", operation: "page" }` and `{ nodeId: "n8n-nodes-base.github", resource: "file", operation: "create" }`

- [ ] **Step 2: Build the workflow**

Five steps, one per rule, in the order R1 to R5, each its own form page, each followed by an IF that routes back to the same page with the missing question when the rule refuses. The five questions and nothing more: a heavier form sends the requester back to Slack (spec section 8).

After the last step: aggregate with Set or Merge, persist the raw response to a Data Table, render `request.md` from the contract 1 template, then create the file in the repository through the GitHub node, then notify the builder.

- [ ] **Step 3: Validate**

Run `validate_workflow` on the built workflow.
Expected: no errors. Warnings are read against the `n8n-validation-expert` skill before acting, since some are known false positives.

- [ ] **Step 4: Test the five refusal paths**

Use `prepare_test_pin_data` then `test_workflow`. Five cases, one per rule, each submitting a response that violates exactly one rule, plus one case that satisfies all five.

Expected: each violating case routes back to its own step and returns the question named in `method/gates.md`, not a generic rejection. The passing case reaches file creation.

Export the validated workflow to `intake/workflow.json`. Write `intake/locales/fr.md` with the French label for each of the five questions and each of the five return questions. Write `intake/README.md` covering installation, the Data Table to create, the GitHub credential needed, and the reminder that the Production URL is the live one and the Test URL is for development only.

- [ ] **Step 5: Commit**

```bash
git add intake
git commit -m "feat: intake form applying R1 to R5 live, writing into the registry"
```

---

### Task 9: The illustrative case, and the cold read

**Files:**
- Create: `examples/crm-lead-enrichment/` with the same seven files
- Modify: `README.md`
- Modify: `docs/decisions.md`
- Test: `bash scripts/check.sh`, then a cold read

**Interfaces:**
- Consumes: everything.
- Produces: the finished layer 1.

- [ ] **Step 1: Write the illustrative case**

`examples/crm-lead-enrichment/` traverses a lead enrichment between two CRMs. It exists so a Sales and Customer Success audience sees the method in their own language rather than in a scanning pipeline.

It must be marked as illustrative in the first line of its README, in those words. An invented case presented as real would undo exactly the credibility the registry entry buys.

Note that `scripts/check.sh` check 4 only walks `registry/`, so this directory is not structurally enforced. Mirror the seven file shape by hand.

- [ ] **Step 2: Finish the README and run the check**

`README.md` gains a two minute path: read `method/overview.md`, look at `registry/job-market-multi-source-scan/` for a real one, copy `method/templates/`. Point at `intake/` as optional.

Run: `bash scripts/check.sh; echo "exit=$?"`
Expected: all `ok`, `exit=0`.

- [ ] **Step 3: The cold read**

Read `README.md` and `method/overview.md` as someone who has never seen the project. Answer four questions out loud. What is this. Who fills what. What blocks me and why. What do I do first.

If any answer needs a file not linked from the README, fix the README.

- [ ] **Step 4: Verify the layer 2 standalone constraint**

Confirm by inspection that nothing in `method/` requires an agent, the MCP server or a running n8n instance. References to the n8n MCP skills are allowed and expected in `method/contracts/idempotency.md` rule I5. A dependency is not.

Record the result in `docs/decisions.md`.

- [ ] **Step 5: Commit**

```bash
git add examples README.md docs/decisions.md
git commit -m "docs: illustrative CRM case, cold read pass, layer 1 complete"
```

---

## Out of scope for this plan

Layer 2 (Claude Code skills and agents, runbook generation, automatic derivation of the test table, the shared error workflow, the scheduled impact chase) and layer 3 (drift detection, catalogue, portfolio review). Spec section 11. Layer 3 stays deliberately unbuilt until a real portfolio exists.
