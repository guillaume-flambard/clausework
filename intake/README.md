# Clausework Intake Form

This is the intake form for the Clausework method, implementing R1 to R5 validation rules live. The form validates user input at each step and routes back to the faulty step with the precise question when validation fails.

**Note:** This workflow is portable and must be imported into your own n8n instance. See Configuration below for setup instructions.

## Overview

The intake form collects five contract 1 fields:
1. Owner: The named person responsible for the automation
2. Trigger: The event and immediate response (when/then format)
3. Volume: Current manual work volume and time spent
4. Success: Observable success criteria
5. Never: The worst case that must never happen

## Installation

### 1. Create the Data Table

Create a new n8n Data Table named `clausework_intake_raw` with the following columns:

| Column Name | Type |
|---|---|
| owner | string |
| trigger_sentence | string |
| today_manual | string |
| success_observable | string |
| never_happens | string |
| submitted_at | string |

### 2. Attach the GitHub Credential

The workflow uses the GitHub node to commit the request file to the registry. You must attach a GitHub credential with write access to the registry repository.

Steps:
1. Open the workflow in n8n
2. Find the "Create Request File in GitHub" node
3. Click on the credentials dropdown and select or create a GitHub API credential
4. The credential must have access to the repository where requests will be stored

If no credential is available, you can configure it manually:
1. Go to n8n Credentials
2. Create a new GitHub API credential using a personal access token with `repo` scope
3. Return to the workflow and select the credential in the GitHub node

### 3. Configure the GitHub Repository

Update the GitHub node parameters to point to your registry repository:
1. Set the Repository Owner to your GitHub username (look for the placeholder `GITHUB_OWNER` in the GitHub node)
2. Set the Repository Name to your target repository (look for the placeholder `REGISTRY_REPOSITORY` in the GitHub node)

The workflow will automatically create a file at `registry/{owner-slug}/request.md` when a form is submitted.

### 4. Deploy the Workflow

Once configured:
1. Activate the workflow
2. Copy the Production Form URL (not the Test URL)
3. Share the Production URL with requesters

## Form URLs

The workflow generates two URLs:

- **Test URL**: Use this during development and testing. Submissions do not trigger the full workflow.
- **Production URL**: Use this for live form submissions. All submissions are processed and written to the registry.

Always use the Production URL for live automation requests.

## How It Works

1. Requester opens the form at the Production URL
2. Form displays Step 1: Owner question
3. Requester fills in their answer and clicks Next
4. If the field is empty:
   - Form displays Step 1 again with the same question
   - Requester corrects their answer
5. If the field is valid:
   - Form advances to Step 2
   - Process repeats for Steps 3, 4, and 5
6. After all five steps are valid:
   - Data is aggregated
   - Raw response is stored to the Data Table
   - request.md file is created in the GitHub repository
   - Completion message is displayed

## Testing the gates

Run `node intake/test-gates.mjs` from the repository root to verify that the five rules correctly refuse bad requests and pass valid ones. No n8n instance is required.

## Validation Rules

The five rules are applied live during form submission. Each rule catches the obvious refusals and passes fields to the scoping conversation:

- **R1 (Owner)**: Refuses if empty OR contains a team word (team, equipe, service, department, group, squad, everyone, all of us, etc.) without a comma separator. A comma indicates the answer is structured as "Name, Title" (e.g., "Tom Wilson, Department Manager"), which passes even if the title contains a team word. The form cannot judge whether a named person has genuine authority; that judgment happens in the scoping conversation.
- **R2 (Trigger)**: Refuses if empty OR missing both "when" and "then". The form cannot verify whether the trigger is correctly shaped for automation; that belongs to the scoping conversation.
- **R3 (Volume)**: Refuses if empty OR contains no digit. The form cannot estimate the real impact; only the requester and builder can do that together.
- **R4 (Success)**: Refuses if empty OR contains neither digit nor percent sign. A criterion you cannot measure is not observable. The form catches unmeasurable claims like "save time"; detailed success criteria belong to the scoping conversation.
- **R5 (Never)**: Refuses if empty OR is a catch-all phrase like "nothing" or "n/a". Every automation touching customer data has a worst case; the form catches empty or dismissive answers. Detailed worst-case planning belongs to the scoping conversation.

When a rule fails, the form returns to that step and displays the precise question from method/gates.md.

## Troubleshooting

### Form not displaying

Check that:
- The workflow is active (not archived or disabled)
- The Production URL is being used (not Test URL)
- The form trigger's path is set correctly

### Data not appearing in Data Table

Check that:
- The Data Table `clausework_intake_raw` exists and is accessible
- The workflow is reaching the "Store to Data Table" step
- Check workflow execution history for errors

### GitHub file not being created

Check that:
- GitHub credential is attached and has `repo` scope
- Repository owner and name are correct
- The GitHub token has write access to the target repository

## Customization

To modify the form questions, French labels, or styling:

1. Edit the form node parameters in the n8n workflow
2. Update `intake/locales/fr.md` for French translations
3. Use custom CSS in the form options for styling

Do not modify the validation logic (IF nodes) without understanding the impact on the R1-R5 rules.

## Technical Details

- Nodes: 13 (1 trigger, 5 form pages, 5 validators, 1 aggregator, 1 storage, 1 GitHub, 1 completion)
- Credentials Required: GitHub API (for file creation)
- Data Table Required: clausework_intake_raw
- Status: Import as unpublished, then activate after configuration

## Adding Notification

If you need the workflow to notify someone when a request is received, add your notification node (Slack, email, webhook, etc.) after the "Create Request File in GitHub" node and before the "Completion" form page. The workflow does not include notification by default so you can choose your notification channel and recipient.
