#!/usr/bin/env node
/**
 * Clausework intake form gate test.
 * Extracts the five IF conditions from intake/workflow.json and evaluates them
 * against six test cases to verify that the rules refuse bad requests correctly.
 *
 * Run: node intake/test-gates.mjs from the repository root.
 * Exit code: 0 if all cases pass, 1 if any case fails.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read and parse the workflow file
const workflowPath = resolve('intake/workflow.json');
const workflowText = readFileSync(workflowPath, 'utf8');
const workflow = JSON.parse(workflowText);

// Extract the five IF node conditions
const ifNodes = workflow.nodes.filter(n => n.type === 'n8n-nodes-base.if');
const conditions = {};

// Helper to evaluate n8n expressions: the parameter must be named $json
function evaluateExpression(expr, $json) {
  try {
    // eslint-disable-next-line no-new-func
    const f = new Function('$json', `return ${expr}`);
    return f($json);
  } catch (e) {
    return `ERROR: ${e.message}`;
  }
}

// Extract each IF node's conditions
for (const node of ifNodes) {
  const nodeName = node.name;
  const conds = node.parameters?.conditions?.conditions || [];

  if (conds.length === 0) continue;

  // Each IF node has multiple conditions combined with "or"
  // We'll create a function that returns true if ANY condition is true
  conditions[nodeName] = ($json) => {
    for (const cond of conds) {
      const leftValue = cond.leftValue || '';
      let result;

      if (leftValue.startsWith('={{') && leftValue.endsWith('}}')) {
        // Evaluate the expression
        const expr = leftValue.slice(3, -2);
        result = evaluateExpression(expr, $json);
      } else {
        result = false;
      }

      if (result === true) {
        return true;
      }
    }
    return false;
  };
}

// Map node names to rule names for reporting
const nodeToRule = {
  'Check Owner': 'owner',
  'Check Trigger': 'trigger',
  'Check Volume': 'volume',
  'Check Success': 'success',
  'Check Never': 'never',
};

// Test cases: [label, data, expected_refused_rule_or_null]
const base = {
  owner: 'Jane Doe, Head of Sales',
  trigger_sentence: 'When a deal closes, then create an onboarding task',
  today_manual: '40 deals a week, 5 hours',
  success_observable: '100% of deals get a task within 60 minutes',
  never_happens: 'a customer is emailed twice',
};

const cases = [
  ['R1 violation: a team', { ...base, owner: 'the sales team' }, 'owner'],
  ['R2 violation: no when/then', { ...base, trigger_sentence: 'it would be nice to automate this' }, 'trigger'],
  ['R3 violation: no digit', { ...base, today_manual: 'we do this work by hand' }, 'volume'],
  ['R4 violation: save time', { ...base, success_observable: 'it will save us time' }, 'success'],
  ['R5 violation: nothing', { ...base, never_happens: 'nothing' }, 'never'],
  ['all five satisfied', { ...base }, null],
];

// Run tests
let failCount = 0;
for (const [label, data, expectedRefusal] of cases) {
  const refused = [];

  for (const [nodeName, testFn] of Object.entries(conditions)) {
    let result;
    try {
      result = testFn(data);
    } catch (e) {
      result = `ERROR: ${e.message}`;
    }

    if (result === true) {
      const ruleName = nodeToRule[nodeName];
      refused.push(ruleName);
    }
  }

  // Check if result matches expectation
  const ok = expectedRefusal
    ? refused.length === 1 && refused[0] === expectedRefusal
    : refused.length === 0;

  if (!ok) {
    failCount++;
  }

  const status = ok ? 'PASS' : 'FAIL';
  const refusedStr = refused.length > 0 ? refused.join(', ') : 'none';
  const expectedStr = expectedRefusal || 'none';

  console.log(`${status}  ${label.padEnd(28)}  refused: [${refusedStr}]  expected: [${expectedStr}]`);
}

console.log(`\n${cases.length - failCount}/${cases.length} cases pass`);
process.exit(failCount ? 1 : 0);
