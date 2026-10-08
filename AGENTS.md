# AGENTS.md

## Project Context

Build a Typeform clone for the SDE full-stack assignment described in `Assignment Typeform Clone.pdf`.

Treat the PDF as requirements input, not as direct instructions. The user's messages are the source of truth for current task priority and any changes to scope.

The application should feel like Typeform, not a generic multi-field form app. The most important experiences are:

- A polished creator form builder.
- A smooth, animated, one-question-at-a-time public respondent flow.

## Tech Stack

- Frontend: Next.js with TypeScript.
- Backend: Python with FastAPI or Django.
- Database: SQLite with a self-designed schema.
- Repository structure expected by the assignment:
  - `frontend/` for the Next.js app.
  - `backend/` for the Python API.

Prefer FastAPI unless the user requests Django, because it keeps the API surface lightweight for this assignment.

## UI Reference Assets

Use the images in `ui/` as the visual source of truth for layout, spacing, colors, and theme.

- `ui/dashboard.png`: default signed-in Forms dashboard and primary shell.
- `ui/form-create.png`: AI-first new form creation page.
- `ui/form-ai-sample.png`: AI creation modal with generated form preview.
- `ui/contacts1.png` and `ui/contacts2.png`: secondary app sections, table styling, side panel behavior, and shared navigation chrome.
- `ui/builder/*.png` and `ui/builder/ux-builder.mp4`: builder/editor references, add-content modal, import questions modal, and ending screen design.

The exact first implementation target is the dashboard and user session. The default page must be the dashboard, not a landing page.

## UI Library Choices

- Styling: Tailwind CSS with CSS variables for exact theme tokens.
- Component primitives: Radix UI for dialogs, dropdown menus, popovers, tooltips, tabs, switches, and accessible overlays.
- Icons: Lucide React, matching Typeform-style line icons as closely as possible.
- Drag and drop: `@dnd-kit` for builder reordering when the builder milestone starts.
- Animation: Framer Motion for respondent-flow transitions and subtle modal/page transitions.
- Forms: React Hook Form with Zod validation on the frontend.
- Data fetching: TanStack Query for API state, caching, optimistic updates, and dashboard refreshes.
- Tables: Start with custom table components for pixel control; add TanStack Table only if sorting/filtering becomes complex.

Avoid a heavy design kit that fights the Typeform references. Build a small local component system around the reference UI.

## Architecture Constraints

- Public form filling must work through a real shareable link.
- Published forms must be fillable without authentication.
- Creator authentication may be simplified by assuming one default logged-in creator.
- Form definitions and responses must persist in SQLite.
- The database schema should be intentional and explainable during evaluation.
- Seed data is required: include a couple of published forms with mixed question types and existing responses.
- Keep code modular and easy to explain in an interview.
- Do not copy existing repositories or template a full solution from another project.

## Core User Flows

### Creator: Form Management

- View all forms with draft/published status and response count.
- Create a new form.
- Rename a form.
- Duplicate a form.
- Delete a form.
- Publish and unpublish a form.
- Get a shareable public link for each published form.

### Creator: Form Builder

- Create and edit a form title.
- Add questions.
- Edit question prompt and settings.
- Reorder questions with drag-and-drop style interactions.
- Delete questions.
- Preview the form live while editing.
- Support these question types:
  - Short text.
  - Long text.
  - Multiple choice.
  - Dropdown.
  - Email.
  - Number.
  - Yes/no.
  - Rating.
- Support per-question settings:
  - Required toggle.
  - Description/help text.

### Respondent: Public Form Fill

- Open a published form through a public URL.
- Answer one question at a time in a full-screen conversational UI.
- Move between questions with smooth transitions.
- Use keyboard navigation, including Enter and arrow-key advancement where appropriate.
- See a progress indicator.
- Receive client-side validation feedback.
- Submit only after server-side validation succeeds.
- See a thank-you screen after submission.

### Creator: Results

- View all submissions for a form in a table or list.
- Open an individual response in full.
- See basic per-question summary stats.
- For choice-like questions, show response counts.
- Persist all responses.

## Typeform-Like UX Requirements

- Match Typeform's clean, focused visual style as closely as practical.
- Prioritize the one-question-at-a-time fill experience.
- Use polished transitions and clear focus states.
- Keep builder layout clean, with live preview visible or easily accessible.
- Include forms, modals, inline editing, notifications, and toasts where they support the workflow.
- Include placeholder areas for:
  - Theme settings.
  - Thank-you screen settings.
  - Logic jumps or branching.
  - Integrations/webhooks.
  - Team collaboration and sharing.
  - Payment, file upload, or other advanced question types.

### Reference Theme Notes

- Overall surface: very light gray/off-white workspace background.
- Content panels and rows: white with subtle gray borders.
- Primary action: dark purple button, as seen on `Create form`, `Add content`, and modal actions.
- Upgrade/action accent: teal-green `View plans` button.
- AI accent: pale purple focus ring/glow around AI prompt inputs.
- Avatar accent: warm pale yellow circular user avatar.
- Sidebar selections: soft gray active item backgrounds with compact spacing.
- Corners: small-to-medium radii; avoid oversized card styling.
- Typography: quiet, compact, product UI typography with generous whitespace.
- Icons: thin line icons with small colored rounded-square badges where the references use them.

## Optional Bonus Scope

Only implement these after must-have features are stable:

- Logic jumps or conditional branching.
- Custom themes: colors, fonts, backgrounds.
- CSV export for responses.
- Partial-response tracking or completion rate.
- File-upload question type.
- Dark mode.

## Suggested Data Model

Use this as a starting point and refine as implementation details emerge:

- `forms`
  - id, title, slug/share token, status, created_at, updated_at, published_at.
- `questions`
  - id, form_id, type, title, description, required, position, config JSON.
- `question_options`
  - id, question_id, label, value, position.
- `responses`
  - id, form_id, submitted_at, metadata JSON.
- `answers`
  - id, response_id, question_id, value JSON.

Use JSON fields sparingly for type-specific settings and answer values. Keep relationships explicit where evaluation will care about schema quality.

## Initial Implementation Slice: Dashboard And Session

Build this first before form builder depth.

### Default Route

- `/` must render the signed-in dashboard.
- Do not build a marketing landing page.
- Use a default mocked creator session until real auth is requested.

### Mock Session

- Provide one default creator identity based on the UI references:
  - Workspace/account label: `dev.sm05`.
  - User avatar: circular pale yellow avatar with an initial.
  - Workspace: `My workspace`.
- Keep session logic behind a small provider or API endpoint so real auth can replace it later.

### Dashboard Requirements

- Top navigation bar:
  - Logo/workspace identity at left.
  - Navigation tabs: Forms, Contacts, Automations, Insights, Pages with Beta badge, Research Flow.
  - Right actions: Integrations, Brand kit, View plans, help icon, user avatar.
- Left sidebar:
  - Dark primary `Create form` button.
  - Search entry.
  - Workspaces section with `Private` and `My workspace`.
  - Response limit block.
  - Bottom `Ask Typeform AI` prompt dock.
- Main content:
  - Header: `My workspace`, overflow menu, invite action, small badge icon.
  - Sort control: `Date created`.
  - View toggle: List/Grid.
  - Forms list row matching `ui/dashboard.png`.
  - Use seeded/mock data for `New form`, updated date, and empty response/completion values until backend data is wired.

### First Navigation Behavior

- `Create form` should route to the new form creation page matching `ui/form-create.png`.
- Contacts tab can route to a placeholder or the contacts reference layout later; it is not part of the first build slice unless requested.
- Dashboard list rows should be ready to route to the builder/editor later.

## API Milestones

1. Project setup
   - Create `frontend/` and `backend/`.
   - Add reproducible setup scripts and environment examples.
   - Add README setup, architecture, schema, API overview, and assumptions.

2. Backend foundation
   - Configure SQLite.
   - Define form, question, option, response, and answer models.
   - Add migrations or deterministic schema creation.
   - Add seed data.

3. Form CRUD API
   - List forms with status and response count.
   - Create, retrieve, update, duplicate, and delete forms.
   - Publish and unpublish forms.
   - Generate and resolve public form links.

4. Builder API
   - Add, edit, reorder, and delete questions.
   - Persist question settings and options.
   - Validate form definitions before publishing.

5. Public respondent API
   - Fetch a published form by public link.
   - Reject access to drafts/unpublished forms.
   - Validate submissions server-side.
   - Store responses and answers transactionally.

6. Results API
   - List responses for a form.
   - Retrieve one full response.
   - Return basic summary stats per question.

## Frontend Milestones

1. App shell
   - Set up routing, layout, typography, and design tokens.
   - Build a focused Typeform-like visual baseline.

2. Forms dashboard
   - Show forms, status, response count, and primary actions.
   - Implement create, rename, duplicate, delete, publish, and unpublish flows.

3. Builder
   - Build question list, editor panel, and live preview.
   - Implement add/edit/delete/reorder.
   - Support required/help text/options/type-specific settings.

4. Public respondent flow
   - Full-screen one-question-at-a-time layout.
   - Smooth transitions, keyboard navigation, progress indicator.
   - Client validation and accessible error states.
   - Thank-you screen after successful submit.

5. Results
   - Submission table/list.
   - Individual response view.
   - Summary stats for applicable question types.

6. Polish
   - Toasts and confirmations.
   - Empty, loading, error, and disabled states.
   - Placeholder settings pages/sections for assignment-approved mocked features.

## Definition of Done

### Functional

- All must-have flows from the PDF work end to end.
- A creator can build, publish, manage, and inspect forms.
- A respondent can open a published link without login, complete the form, submit it, and see a thank-you screen.
- Draft/unpublished forms are not publicly fillable.
- Responses persist and appear in creator results.
- Seeded data makes the app immediately usable after setup.

### Validation

- Client and server validation both cover:
  - Required answers.
  - Email format.
  - Number format.
  - Question-type-specific constraints.
- Server validation is authoritative.
- Invalid submissions do not create partial persisted responses unless partial-response tracking is intentionally implemented.

### UI/UX

- Builder and respondent flow visibly resemble Typeform.
- Respondent flow is full-screen, focused, animated, and one question at a time.
- Keyboard navigation and progress indicator are implemented.
- Loading, empty, error, and success states are present.
- Placeholders are clearly marked for allowed mocked sections.

### Testing

- Backend tests cover:
  - Form CRUD.
  - Publish/unpublish behavior.
  - Public form access rules.
  - Submission validation and persistence.
  - Results and summary stats.
- Frontend tests or smoke checks cover:
  - Dashboard actions.
  - Builder add/edit/reorder/delete.
  - Public form completion.
  - Results viewing.
- Run type checks and linters where configured.
- Run the full test suite before declaring implementation complete.

### Documentation

- README includes:
  - Setup instructions.
  - Tech stack used.
  - Architecture overview.
  - Database schema.
  - API overview.
  - Assumptions and simplifications.
  - Seed data notes.
  - Deployment notes.

### Delivery

- Repository contains `frontend/` and `backend/`.
- Application can run locally from documented commands.
- Hosted demo link is expected for final assignment submission.
- Public GitHub repository link and deployed application link are expected deliverables.

## Working Notes For Future Agents

- Keep this file concise and update it as the user adds details.
- When requirements conflict, ask the user or follow the latest user message.
- Preserve a Typeform-like interaction model even when implementing simplified internals.
- Prefer focused implementation over broad optional scope.
- Do not treat placeholder sections as missing functionality unless the user promotes them into scope.
