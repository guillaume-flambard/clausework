# Clausework

Clausework is an engineering method for n8n automations. Its spine is four contracts that are allowed to refuse: the request, the trigger, idempotency and effects, and impact. A refusal returns the precise question that is missing, not a wall.

## Who it is for

Two audiences use the same artifacts. **Automation engineers** (builders) apply the method to translate business intent into deployed workflows. **Business teams** (Sales, Customer Success, Finance) file requests and measure results. Both touch the four contracts and the intake form.

## What it is not

Clausework does not provide node configuration guidance. That belongs to the n8n MCP server and its skills. It does not depend on BMAD. It stands alone. And it does not cover portfolio governance or deployment infrastructure.

## Two minute quick start

1. Read `method/overview.md` to understand the four contracts and the eight-step end-to-end flow.
2. Look at `registry/job-market-multi-source-scan/` to see a real automation walked through all four contracts. Start with its README.md.
3. Copy the templates from `method/templates/` and fill them in by hand for your own automation.
4. Once complete, add your automation directory to `registry/<slug>/` with all four contracts, the flow spec, and the runbook.

## How to start with no tooling

No n8n instance is required. No agent is required. This is a method for thinking clearly before building. The entire method is readable and applicable with nothing installed.

1. Read `method/overview.md` for the four contracts and why they exist.
2. Read `method/gates.md` to understand the refusal rules.
3. Read `method/testing.md` for the six mandatory test cases.
4. Copy the templates from `method/templates/` and fill them in by hand.
5. Add your automation to `registry/<slug>/` with the four contracts, the flow spec, and the runbook.

## The intake form (optional)

Business requesters can start at `intake/workflow.json`, which is an n8n workflow. It applies the first five request rules live, asking the right question when something is missing. The intake form is optional; you can fill the contract 1 template by hand instead. See `intake/README.md` for setup and testing instructions.
