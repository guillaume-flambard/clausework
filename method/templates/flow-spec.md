# Flow spec template

The flow spec cuts the automation into testable steps. Each step is a unit with its expected input, its expected output, and the side effects it triggers if any.

That cut is what makes step 5 (validation) possible. Each step runs on its own against pinned test data.

## Example structure

```markdown
# Flow spec: <automation name>

## Step 1: <name>

Input: <describe the data entering this step>

Output: <describe the data leaving this step>

Side effects: <list any systems this step changes, or "none">

---

## Step 2: <name>

Input: <describe the data entering this step>

Output: <describe the data leaving this step>

Side effects: <list any systems this step changes, or "none">

---

## Step N: <name>

Input: <describe the data entering this step>

Output: <describe the data leaving this step>

Side effects: <list any systems this step changes, or "none">
```

## How to fill it

- **Input.** What data does this step receive, and where does it come from? (Example: "A Slack message object extracted from the trigger.")
- **Output.** What data does this step produce for the next step? (Example: "An array of usernames to invite.")
- **Side effects.** Any system state this step changes. External API calls, database writes, sending mail, posting to Slack, file creation. (Example: "Creates a task in Jira." or "Sends an email to the customer." If the step is pure data transformation, write "none".)

## The unit of testing

Each step is tested independently against its expected input and output. If Step 2 has unexpected output, the test fails at Step 2. The flow spec is the instrument that makes this precision possible.

The test cases from `method/testing.md` (nominal, replay, peak, broken data, zero items, cap) are run using these steps as the boundaries.
