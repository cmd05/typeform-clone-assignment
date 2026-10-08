import re
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Response as FastAPIResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import Answer, Form, FormEnding, Question, QuestionOption, Response
from app.schemas import (
    BuilderEndingWrite,
    BuilderQuestionWrite,
    BuilderSave,
    FormCreate,
    FormListItem,
    FormRead,
    FormResultsRead,
    ResultAnswerRead,
    ResultQuestionRead,
    ResultResponseRead,
    ResultSummaryItem,
    FormUpdate,
)
from app.seed import seed_dummy_responses_for_form

router = APIRouter(prefix="/forms", tags=["forms"])
CHOICE_TYPES = {"multiple_choice", "dropdown"}
SUPPORTED_BUILDER_TYPES = {
    "group",
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


@router.get("", response_model=list[FormListItem])
def list_forms(db: Session = Depends(get_db)) -> list[FormListItem]:
    response_counts = (
        select(Response.form_id, func.count(Response.id).label("response_count"))
        .group_by(Response.form_id)
        .subquery()
    )

    rows = db.execute(
        select(Form, func.coalesce(response_counts.c.response_count, 0))
        .outerjoin(response_counts, Form.id == response_counts.c.form_id)
        .order_by(Form.updated_at.desc())
    ).all()

    return [
        FormListItem(
            id=form.id,
            title=form.title,
            slug=form.slug,
            status=form.status,
            response_count=response_count,
            created_at=form.created_at,
            updated_at=form.updated_at,
            published_at=form.published_at,
        )
        for form, response_count in rows
    ]


@router.post("", response_model=FormRead, status_code=201)
def create_form(payload: FormCreate, db: Session = Depends(get_db)) -> FormRead:
    title = payload.title.strip() or "Untitled form"
    form = Form(title=title, slug=unique_slug(db, title), status="draft")
    db.add(form)
    db.flush()

    if not payload.start_empty:
        question = Question(
            form_id=form.id,
            type="short_text",
            title="Your first question",
            description="Description (optional)",
            required=True,
            position=1,
            config={"placeholder": "Type your answer here"},
        )
        ending = FormEnding(
            form_id=form.id,
            title="Thanks for sharing!",
            description="Your response has been recorded.",
            button_text="Done",
            image_url=None,
            position=1,
            config={},
        )
        db.add_all([question, ending])
    db.commit()

    return get_form(form.id, db)


@router.get("/{form_id}", response_model=FormRead)
def get_form(form_id: int, db: Session = Depends(get_db)) -> FormRead:
    form = db.scalar(
        select(Form)
        .where(Form.id == form_id)
        .options(
            selectinload(Form.questions).selectinload(Question.options),
            selectinload(Form.questions).selectinload(Question.children).selectinload(Question.options),
            selectinload(Form.endings),
        )
    )
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")

    response_count = db.scalar(
        select(func.count(Response.id)).where(Response.form_id == form.id)
    )

    return FormRead(
        id=form.id,
        title=form.title,
        slug=form.slug,
        status=form.status,
        response_count=response_count or 0,
        created_at=form.created_at,
        updated_at=form.updated_at,
        published_at=form.published_at,
        questions=[question for question in form.questions if question.parent_id is None],
        endings=form.endings,
    )


@router.patch("/{form_id}", response_model=FormRead)
def update_form(
    form_id: int,
    payload: FormUpdate,
    db: Session = Depends(get_db),
) -> FormRead:
    form = get_form_model(db, form_id)
    if payload.title is not None:
        title = payload.title.strip()
        if not title:
            raise HTTPException(status_code=422, detail="Title cannot be empty")
        form.title = title
    db.commit()
    return get_form(form.id, db)


@router.delete("/{form_id}", status_code=204)
def delete_form(form_id: int, db: Session = Depends(get_db)) -> FastAPIResponse:
    form = get_form_model(db, form_id)
    db.delete(form)
    db.commit()
    return FastAPIResponse(status_code=204)


@router.post("/{form_id}/duplicate", response_model=FormRead, status_code=201)
def duplicate_form(form_id: int, db: Session = Depends(get_db)) -> FormRead:
    source = db.scalar(
        select(Form)
        .where(Form.id == form_id)
        .options(
            selectinload(Form.questions).selectinload(Question.options),
            selectinload(Form.endings),
        )
    )
    if not source:
        raise HTTPException(status_code=404, detail="Form not found")

    clone = Form(
        title=f"{source.title} copy",
        slug=unique_slug(db, f"{source.title} copy"),
        status="draft",
    )
    db.add(clone)
    db.flush()

    id_map: dict[int, Question] = {}
    for question in sorted(source.questions, key=lambda item: (item.parent_id or 0, item.position)):
        cloned_question = Question(
            form_id=clone.id,
            parent_id=id_map[question.parent_id].id if question.parent_id else None,
            type=question.type,
            title=question.title,
            description=question.description,
            required=question.required,
            position=question.position,
            config=dict(question.config or {}),
        )
        db.add(cloned_question)
        db.flush()
        id_map[question.id] = cloned_question
        for option in question.options:
            db.add(
                QuestionOption(
                    question_id=cloned_question.id,
                    label=option.label,
                    value=option.value,
                    position=option.position,
                )
            )

    for ending in source.endings:
        db.add(
            FormEnding(
                form_id=clone.id,
                title=ending.title,
                description=ending.description,
                button_text=ending.button_text,
                image_url=ending.image_url,
                position=ending.position,
                config=dict(ending.config or {}),
            )
        )

    db.commit()
    return get_form(clone.id, db)


@router.post("/{form_id}/publish", response_model=FormRead)
def publish_form(form_id: int, db: Session = Depends(get_db)) -> FormRead:
    form = get_form_model(db, form_id)
    validate_form_definition(form)
    form.status = "published"
    form.published_at = datetime.now(timezone.utc)
    db.commit()
    return get_form(form.id, db)


@router.post("/{form_id}/unpublish", response_model=FormRead)
def unpublish_form(form_id: int, db: Session = Depends(get_db)) -> FormRead:
    form = get_form_model(db, form_id)
    form.status = "draft"
    form.published_at = None
    db.commit()
    return get_form(form.id, db)


@router.get("/{form_id}/results", response_model=FormResultsRead)
def get_form_results(form_id: int, db: Session = Depends(get_db)) -> FormResultsRead:
    form = db.scalar(
        select(Form)
        .where(Form.id == form_id)
        .options(
            selectinload(Form.questions).selectinload(Question.options),
            selectinload(Form.questions).selectinload(Question.children).selectinload(Question.options),
            selectinload(Form.responses).selectinload(Response.answers).selectinload(Answer.question),
        )
    )
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")

    questions = flatten_questions([question for question in form.questions if question.parent_id is None])
    question_by_id = {question.id: question for question in questions}
    responses = sorted(form.responses, key=lambda item: item.submitted_at, reverse=True)
    summaries = build_summaries(questions, responses)

    return FormResultsRead(
        form_id=form.id,
        title=form.title,
        slug=form.slug,
        response_count=len(responses),
        questions=[
            ResultQuestionRead(
                id=question.id,
                type=question.type,
                title=question.title,
                position=question.position,
                options=[option.label for option in question.options],
            )
            for question in questions
        ],
        responses=[
            ResultResponseRead(
                id=response.id,
                submitted_at=response.submitted_at,
                answers=[
                    ResultAnswerRead(
                        question_id=answer.question_id,
                        title=question_by_id.get(answer.question_id).title
                        if question_by_id.get(answer.question_id)
                        else "Deleted question",
                        value=(answer.value or {}).get("value"),
                    )
                    for answer in sorted(
                        response.answers,
                        key=lambda answer: question_by_id.get(answer.question_id).position
                        if question_by_id.get(answer.question_id)
                        else 9999,
                    )
                ],
            )
            for response in responses
        ],
        summaries=summaries,
    )


@router.put("/{form_id}/builder", response_model=FormRead)
def save_builder(
    form_id: int,
    payload: BuilderSave,
    db: Session = Depends(get_db),
) -> FormRead:
    form = get_form_model(db, form_id)
    reseed_demo_responses = bool(form.responses) and all(
        (response.metadata_json or {}).get("seed") for response in form.responses
    )

    for question in list(form.questions):
        if question.parent_id is None:
            db.delete(question)
    for ending in list(form.endings):
        db.delete(ending)
    db.flush()

    for index, question_payload in enumerate(payload.questions, start=1):
        create_question_tree(
            db=db,
            form_id=form.id,
            payload=question_payload,
            position=index,
            parent_id=None,
        )

    for index, ending_payload in enumerate(payload.endings, start=1):
        create_ending(db, form.id, ending_payload, index)

    if payload.questions and not payload.endings:
        db.add(
            FormEnding(
                form_id=form.id,
                title="Thanks for sharing!",
                description="Your response has been recorded.",
                button_text="Done",
                image_url=None,
                position=1,
                config={},
            )
        )

    if reseed_demo_responses:
        seed_dummy_responses_for_form(db, form.id)

    db.commit()
    return get_form(form.id, db)


def get_form_model(db: Session, form_id: int) -> Form:
    form = db.get(Form, form_id)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    return form


def unique_slug(db: Session, title: str) -> str:
    base = slugify(title)
    slug = base
    suffix = 2
    while db.scalar(select(Form.id).where(Form.slug == slug)):
        slug = f"{base}-{suffix}"
        suffix += 1
    return slug


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.strip().lower()).strip("-")
    return slug or "untitled-form"


def flatten_questions(questions: list[Question]) -> list[Question]:
    flattened: list[Question] = []
    for question in questions:
        if question.type != "group":
            flattened.append(question)
        flattened.extend(flatten_questions(list(question.children)))
    return flattened


def build_summaries(
    questions: list[Question],
    responses: list[Response],
) -> list[ResultSummaryItem]:
    summary_types = {"multiple_choice", "dropdown", "yes_no", "rating"}
    question_by_id = {question.id: question for question in questions}
    counts_by_question: dict[int, dict[str, int]] = {
        question.id: {} for question in questions if question.type in summary_types
    }

    for response in responses:
        for answer in response.answers:
            question = question_by_id.get(answer.question_id)
            if not question or question.type not in summary_types:
                continue
            value = str((answer.value or {}).get("value") or "").strip()
            if not value:
                continue
            counts_by_question[question.id][value] = counts_by_question[question.id].get(value, 0) + 1

    summaries: list[ResultSummaryItem] = []
    for question in questions:
        if question.type not in summary_types:
            continue
        counts = counts_by_question.get(question.id, {})
        if question.type in {"multiple_choice", "dropdown", "yes_no"}:
            counts = {option.label: counts.get(option.label, 0) for option in question.options}
        summaries.append(
            ResultSummaryItem(
                question_id=question.id,
                title=question.title,
                type=question.type,
                counts=counts,
            )
        )
    return summaries


def create_question_tree(
    db: Session,
    form_id: int,
    payload: BuilderQuestionWrite,
    position: int,
    parent_id: int | None,
) -> Question:
    validate_question_payload(payload)
    question = Question(
        form_id=form_id,
        parent_id=parent_id,
        type=payload.type,
        title=payload.title.strip() or "Untitled question",
        description=payload.description,
        required=payload.required,
        position=position,
        config=dict(payload.config or {}),
    )
    db.add(question)
    db.flush()

    for option_index, label in enumerate(payload.options, start=1):
        value = label.strip()
        if not value:
            continue
        db.add(
            QuestionOption(
                question_id=question.id,
                label=value,
                value=value,
                position=option_index,
            )
        )

    for child_index, child in enumerate(payload.children, start=1):
        create_question_tree(
            db=db,
            form_id=form_id,
            payload=child,
            position=child_index,
            parent_id=question.id,
        )

    return question


def validate_form_definition(form: Form) -> None:
    questions = flatten_questions([question for question in form.questions if question.parent_id is None])
    answerable_questions = [
        question for question in questions if question.type not in {"statement", "welcome"}
    ]
    if not questions or not answerable_questions:
        raise HTTPException(status_code=422, detail="Add at least one answerable question before publishing")

    errors: list[str] = []
    for question in questions:
        if question.type not in SUPPORTED_BUILDER_TYPES:
            errors.append(f"{question.title} has an unsupported question type.")
        if not question.title.strip():
            errors.append("Every question needs a title.")
        if question.type in CHOICE_TYPES and not question.options:
            errors.append(f"{question.title} needs at least one option.")
        if question.type == "rating":
            rating_count = (question.config or {}).get("ratingCount") or 5
            if not isinstance(rating_count, int) or rating_count < 1 or rating_count > 10:
                errors.append(f"{question.title} needs a rating count between 1 and 10.")

    if errors:
        raise HTTPException(status_code=422, detail=errors)


def validate_question_payload(payload: BuilderQuestionWrite) -> None:
    if payload.type not in SUPPORTED_BUILDER_TYPES:
        raise HTTPException(status_code=422, detail=f"{payload.type} is not a supported question type")
    if payload.type in CHOICE_TYPES and not [option.strip() for option in payload.options if option.strip()]:
        raise HTTPException(status_code=422, detail=f"{payload.title or 'Choice question'} needs at least one option")
    if payload.type == "rating":
        rating_count = (payload.config or {}).get("ratingCount") or 5
        if not isinstance(rating_count, int) or rating_count < 1 or rating_count > 10:
            raise HTTPException(status_code=422, detail="Rating questions need a rating count between 1 and 10")


def create_ending(
    db: Session,
    form_id: int,
    payload: BuilderEndingWrite,
    position: int,
) -> FormEnding:
    ending = FormEnding(
        form_id=form_id,
        title=payload.title.strip() or "Thanks for sharing!",
        description=payload.description,
        button_text=payload.button_text.strip() or "Done",
        image_url=payload.image_url,
        position=position,
        config=dict(payload.config or {}),
    )
    db.add(ending)
    return ending
