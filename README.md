# Typeform Clone

Live demo: https://typeform-clone-salil.vercel.app

A full-stack Typeform-style form builder for the SDE assignment. It includes a creator dashboard, editable form builder, publishing/share flow, public one-question-at-a-time form filling, and basic results views.

## Tech Stack

- Frontend: Next.js, TypeScript, Tailwind CSS, Framer Motion, Radix UI, Lucide React.
- Backend: FastAPI, SQLAlchemy, Pydantic.
- Database: SQLite.
- Deployment: Vercel frontend and Vercel Python backend.

## Features

- Dashboard with form CRUD, duplicate, publish/unpublish, delete confirmation, and share links.
- Builder with editable questions, options, descriptions, required settings, drag reorder, endings, and live preview.
- Supported question types: short text, long text, email, phone, number, multiple choice, dropdown, yes/no, and rating.
- Public form flow with validation, keyboard-friendly progression, progress indicator, and thank-you screen.
- Results section with performance metrics, response summary, response table, filters, and seeded dummy responses.

## Local Setup

Backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`. The backend defaults to `http://127.0.0.1:8000`.

## Environment

Backend `.env`:

```env
DATABASE_URL=sqlite:///./typeform_clone.db
FRONTEND_ORIGIN=http://localhost:3000
```

Frontend `.env.local` when needed:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

## API Overview

- `GET /health`
- `/forms`: list, create, retrieve, update, delete, duplicate, publish, unpublish.
- `PUT /forms/{id}/builder`: save builder questions and endings.
- `GET /forms/{id}/results`: response summaries and response table data.
- `/public/forms/{id}/{slug}`: fetch and submit published forms.

## Database

The schema uses explicit relational tables for `forms`, `questions`, `question_options`, `form_endings`, `responses`, and `answers`. Type-specific settings and answer values use JSON only where it keeps the model flexible.

Seed data creates multiple sample forms plus logical dummy responses for testing the dashboard, public flow, and results screens.

## Testing

```bash
cd backend
.venv\Scripts\python.exe -m pytest
```

```bash
cd frontend
npm run typecheck
npm run build
```

## Assumptions

- The app uses one sample logged-in user instead of complete authentication.
- The database is SQLite. On Vercel, demo data may reset because the database is temporary.
- Workflow, Connect, integrations, branching, payments, and file uploads are shown as placeholders only.
- The backend does the final validation before publishing forms or saving submissions.
