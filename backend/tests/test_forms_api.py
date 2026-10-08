import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.api.forms import (
    create_form,
    delete_form,
    duplicate_form,
    get_form,
    get_form_results,
    publish_form,
    save_builder,
    unpublish_form,
    update_form,
)
from app.api.public import submit_public_form
from app.models import Form, Question
from app.schemas import (
    BuilderEndingWrite,
    BuilderQuestionWrite,
    BuilderSave,
    FormCreate,
    FormUpdate,
    PublicAnswerWrite,
    PublicSubmissionCreate,
)


def test_form_crud_publish_unpublish_duplicate_and_delete(db_session: Session) -> None:
    form = create_form(FormCreate(title="Customer Survey", start_empty=True), db_session)
    assert form.title == "Customer Survey"
    assert form.status == "draft"

    renamed = update_form(form.id, FormUpdate(title="Customer Survey v2"), db_session)
    assert renamed.title == "Customer Survey v2"

    with pytest.raises(HTTPException) as invalid_publish:
        publish_form(form.id, db_session)
    assert invalid_publish.value.status_code == 422

    saved = save_builder(
        form.id,
        BuilderSave(
            questions=[
                BuilderQuestionWrite(
                    type="short_text",
                    title="What is your name?",
                    position=1,
                    required=True,
                )
            ],
            endings=[
                BuilderEndingWrite(
                    title="Thank you",
                    description="Done",
                    button_text="Done",
                    position=1,
                )
            ],
        ),
        db_session,
    )
    assert len(saved.questions) == 1

    published = publish_form(form.id, db_session)
    assert published.status == "published"
    assert published.published_at is not None

    duplicated = duplicate_form(form.id, db_session)
    assert duplicated.status == "draft"
    assert duplicated.title == "Customer Survey v2 copy"

    unpublished = unpublish_form(form.id, db_session)
    assert unpublished.status == "draft"
    assert unpublished.published_at is None

    delete_form(form.id, db_session)
    with pytest.raises(HTTPException) as missing_form:
        get_form(form.id, db_session)
    assert missing_form.value.status_code == 404


def test_builder_rejects_invalid_choice_question(db_session: Session) -> None:
    form = create_form(FormCreate(title="Bad Choices", start_empty=True), db_session)

    with pytest.raises(HTTPException) as error:
        save_builder(
            form.id,
            BuilderSave(
                questions=[
                    BuilderQuestionWrite(
                        type="dropdown",
                        title="Pick one",
                        position=1,
                        required=True,
                        options=[],
                    )
                ],
                endings=[],
            ),
            db_session,
        )

    assert error.value.status_code == 422


def test_results_summary_counts_choice_answers(db_session: Session, published_form: Form) -> None:
    questions = {question.title: question for question in db_session.query(Question).all()}
    payload = PublicSubmissionCreate(
        answers=[
            PublicAnswerWrite(question_id=questions["Your name"].id, value="Aquila"),
            PublicAnswerWrite(question_id=questions["Email"].id, value="aquila@example.com"),
            PublicAnswerWrite(question_id=questions["Phone"].id, value="9876543210"),
            PublicAnswerWrite(question_id=questions["Budget"].id, value="55000"),
            PublicAnswerWrite(question_id=questions["Use case"].id, value="Study"),
            PublicAnswerWrite(question_id=questions["Brand"].id, value="Lenovo"),
            PublicAnswerWrite(question_id=questions["Refurbished"].id, value="No"),
            PublicAnswerWrite(question_id=questions["Ease"].id, value="4"),
        ],
        metadata={},
    )
    submit_public_form("validation-form", payload, db_session)

    results = get_form_results(published_form.id, db_session)
    assert results.response_count == 1
    use_case_summary = next(item for item in results.summaries if item.title == "Use case")
    assert use_case_summary.counts == {"Study": 1, "Gaming": 0}
