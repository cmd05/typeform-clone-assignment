import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.forms import router as forms_router
from app.api.public import router as public_router
from app.database import Base, SessionLocal, engine
from app.seed import seed_database

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_database(db)
    yield


app = FastAPI(
    title="Typeform Clone API",
    version="0.1.0",
    lifespan=lifespan,
)

frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(forms_router)
app.include_router(public_router)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
