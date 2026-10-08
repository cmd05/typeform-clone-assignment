# Typeform Clone

Initial implementation slice for the Typeform clone assignment.

## Current Slice

- `frontend/` contains a Next.js TypeScript app.
- `/` renders the signed-in dashboard by default.
- A mocked creator session powers the current shell:
  - account label: `dev.sm05`
  - workspace: `My workspace`
  - avatar initial: `S`
- `/forms/new` renders the AI-first form creation page.
- Dashboard rows are wired to placeholder builder routes for the next slice.

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

## Backend Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open `http://localhost:8000/health`.

The backend currently includes the FastAPI app, SQLite schema creation, seeded
sample form data, form CRUD, publish/unpublish, duplicate, and public read
endpoints.

## UI References

The current UI follows the screenshots in `ui/`, especially:

- `ui/dashboard.png`
- `ui/form-create.png`
- `ui/builder/*`

See `AGENTS.md` for the full implementation charter.
