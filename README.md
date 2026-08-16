# Clausework

Clausework is an engineering method for n8n automations. Its spine is four contracts that are allowed to refuse: the request, the trigger, idempotency and effects, and impact. A refusal returns the precise question that is missing, not a wall.

## Who it is for

Two audiences use the same artifacts. **Automation engineers** (builders) apply the method to translate business intent into deployed workflows. **Business teams** (Sales, Customer Success, Finance) file requests and measure results. Both touch the four contracts and the intake form.

## What it is not

Clausework does not provide node configuration guidance. That belongs to the n8n MCP server and its skills. It does not depend on BMAD. It stands alone. And it does not cover portfolio governance or deployment infrastructure.

## How to start with no tooling

1. Read `method/overview.md` for the four contracts and why they exist.
2. Read `method/gates.md` to understand the refusal rules.
3. Copy the templates from `method/templates/` and fill them in by hand.
4. Add your automation to `registry/<slug>/` with the four contracts, the flow spec, and the runbook.

No n8n instance is required. No agent is required. This is a method for thinking clearly before building.

## The intake form

Business requesters start at `intake/workflow.json`, which is an n8n workflow. It applies the first five request rules live, asking the right question when something is missing.
