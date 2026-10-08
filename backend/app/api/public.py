import re
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import Answer, Form, Question, Response
from app.schemas import PublicFormRead, PublicSubmissionCreate, PublicSubmissionRead

router = APIRouter(prefix="/public/forms", tags=["public forms"])
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
SUPPORTED_QUESTION_TYPES = {
    "short_text",
    "long_text",
    "email",
    "phone",
    "multiple_choice",
    "dropdown",
    "number",
    "yes_no",
    "rating",
    "statement",
    "welcome",
}


@router.get("/{slug}", response_model=PublicFormRead)
def get_public_form(slug: str, db: Session = Depends(get_db)) -> PublicFormRead:
    form = get_published_form(slug, db)

    return PublicFormRead(
        title=form.title,
        slug=form.slug,
        questions=[question for question in form.questions if question.parent_id is None],
        endings=form.endings,
    )


@router.post("/{slug}/responses", response_model=PublicSubmissionRead, status_code=201)
def submit_public_form(
    slug: str,
    payload: PublicSubmissionCreate,
    db: Session = Depends(get_db),
) -> PublicSubmissionRead:
    form = get_published_form(slug, db)
    questions = flatten_questions(
        [question for question in form.questions if question.parent_id is None]
    )
    question_by_id = {question.id: question for question in questions}
    answer_by_question_id: dict[int, Any] = {}
    duplicate_ids: set[int] = set()
    for answer in payload.answers:
        if answer.question_id in answer_by_question_id:
            duplicate_ids.add(answer.question_id)
        answer_by_question_id[answer.question_id] = answer.value

    unknown_ids = set(answer_by_question_id) - set(question_by_id)
    if unknown_ids:
        raise HTTPException(status_code=422, detail="Submission contains unknown questions")
    if duplicate_ids:
        raise HTTPException(status_code=422, detail="Submission contains duplicate answers")

    errors: list[str] = []
    for question in questions:
        error = validate_answer(question, answer_by_question_id.get(question.id))
        if error:
            errors.append(error)

    if errors:
        raise HTTPException(status_code=422, detail=errors)

    response = Response(
        form_id=form.id,
        metadata_json={
            **dict(payload.metadata or {}),
            "submitted_via": "public_form",
        },
    )
    db.add(response)
    db.flush()

    for question_id, raw_value in answer_by_question_id.items():
        if is_blank(raw_value):
            continue
        db.add(
            Answer(
                response_id=response.id,
                question_id=question_id,
                value={"value": normalize_answer(raw_value)},
            )
        )

    db.commit()
    db.refresh(response)
    return PublicSubmissionRead(id=response.id, submitted_at=response.submitted_at)


def get_published_form(slug: str, db: Session) -> Form:
    form = db.scalar(
        select(Form)
        .where(Form.slug == slug)
        .options(
            selectinload(Form.questions).selectinload(Question.options),
            selectinload(Form.questions).selectinload(Question.children).selectinload(Question.options),
            selectinload(Form.endings),
        )
    )
    if not form or form.status != "published":
        raise HTTPException(status_code=404, detail="Published form not found")
    return form


def flatten_questions(questions: list[Question]) -> list[Question]:
    flattened: list[Question] = []
    for question in questions:
        if question.type != "group":
            flattened.append(question)
        flattened.extend(flatten_questions(list(question.children)))
    return flattened


def validate_answer(question: Question, raw_value: Any) -> str:
    value = answer_to_text(raw_value)
    if question.type not in SUPPORTED_QUESTION_TYPES:
        return f"{question.title} has an unsupported question type."
    if question.type in {"statement", "welcome"}:
        return ""
    if question.required and not value:
        return f"{question.title} is required."
    if not value:
        return ""
    if question.type in {"short_text", "long_text"}:
        max_characters = (question.config or {}).get("maxCharacters")
        max_enabled = bool((question.config or {}).get("maxCharactersEnabled"))
        if max_enabled and isinstance(max_characters, int) and len(value) > max_characters:
            return f"{question.title} must be {max_characters} characters or fewer."
    if question.type == "email" and not EMAIL_RE.match(value):
        return f"{question.title} must be a valid email address."
    if question.type == "phone" and len(only_digits(value)) != 10:
        return f"{question.title} must be a 10 digit phone number."
    if question.type == "number":
        try:
            float(value)
        except ValueError:
            return f"{question.title} must be a number."
    if question.type in {"multiple_choice", "dropdown"}:
        allowed = {option.label for option in question.options}
        if allowed and value not in allowed:
            return f"{question.title} has an invalid choice."
    if question.type == "yes_no":
        allowed = {option.label for option in question.options} or {"Yes", "No"}
        if value not in allowed:
            return f"{question.title} must be Yes or No."
    if question.type == "rating":
        try:
            rating = int(value)
        except ValueError:
            return f"{question.title} must be a rating."
        max_rating = int((question.config or {}).get("ratingCount") or 5)
        if rating < 1 or rating > max_rating:
            return f"{question.title} must be between 1 and {max_rating}."
    return ""


def normalize_answer(value: Any) -> Any:
    if isinstance(value, str):
        return value.strip()
    return value


def is_blank(value: Any) -> bool:
    return not answer_to_text(value)


def only_digits(value: str) -> str:
    return re.sub(r"\D+", "", value)


def answer_to_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, int | float):
        return str(value).strip()
    if isinstance(value, dict):
        for key in ("value", "number", "phone", "text"):
            nested_value = value.get(key)
            if nested_value is not None:
                return answer_to_text(nested_value)
    return str(value).strip()
