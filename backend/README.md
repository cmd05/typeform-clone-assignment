# Typeform Clone Backend

FastAPI + SQLite backend for the assignment.

## Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API runs at `http://localhost:8000`.

## Current Scope

- SQLite schema creation on startup.
- Seeded `Laptop Finder` published form.
- `GET /health`
- `GET /forms`
- `POST /forms`
- `GET /forms/{form_id}`
- `PATCH /forms/{form_id}`
- `DELETE /forms/{form_id}`
- `POST /forms/{form_id}/duplicate`
- `POST /forms/{form_id}/publish`
- `POST /forms/{form_id}/unpublish`
- `GET /public/forms/{form_id}/{slug}`
- `POST /public/forms/{form_id}/{slug}/responses`

Seed data includes `Laptop Finder`, `Team Retro Check-in`, `Event Feedback`,
and `Product Research Pulse`.

## Data Model

- `forms`: creator form metadata, status, slug.
- `questions`: form questions and grouped child questions.
- `question_options`: choice/dropdown/yes-no options.
- `form_endings`: thank-you/recommendation screens.
- `responses`: submitted response envelope.
- `answers`: per-question response values.

The next backend slice should add question and ending persistence endpoints for
the builder.
