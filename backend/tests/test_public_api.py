import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.api.public import get_public_form, submit_public_form
from app.models import Form, Question, Response
from app.schemas import PublicAnswerWrite, PublicSubmissionCreate


def answer_payload(db_session: Session) -> PublicSubmissionCreate:
    questions = {question.title: question for question in db_session.query(Question).all()}
    return PublicSubmissionCreate(
        answers=[
            PublicAnswerWrite(question_id=questions["Your name"].id, value="Aquila"),
            PublicAnswerWrite(question_id=questions["Email"].id, value="aquila@example.com"),
            PublicAnswerWrite(question_id=questions["Phone"].id, value={"number": "9876543210"}),
            PublicAnswerWrite(question_id=questions["Budget"].id, value=55000),
            PublicAnswerWrite(question_id=questions["Use case"].id, value="Study"),
            PublicAnswerWrite(question_id=questions["Brand"].id, value="Lenovo"),
            PublicAnswerWrite(question_id=questions["Refurbished"].id, value="Yes"),
            PublicAnswerWrite(question_id=questions["Ease"].id, value=5),
        ],
        metadata={"device": "test"},
    )


def test_public_form_rejects_unpublished_forms(db_session: Session, published_form: Form) -> None:
    published_form.status = "draft"
    db_session.commit()

    with pytest.raises(HTTPException) as error:
        get_public_form(published_form.id, "validation-form", db_session)

    assert error.value.status_code == 404


def test_public_submission_persists_valid_answers(
    db_session: Session,
    published_form: Form,
) -> None:
    response = submit_public_form(
        published_form.id,
        "validation-form",
        answer_payload(db_session),
        db_session,
    )

    assert response.id is not None
    assert db_session.query(Response).count() == 1
    stored_response = db_session.query(Response).one()
    assert len(stored_response.answers) == 8


def test_public_submission_validates_required_and_type_specific_answers(
    db_session: Session,
    published_form: Form,
) -> None:
    questions = {question.title: question for question in db_session.query(Question).all()}
    payload = PublicSubmissionCreate(
        answers=[
            PublicAnswerWrite(question_id=questions["Your name"].id, value="A" * 31),
            PublicAnswerWrite(question_id=questions["Email"].id, value="bad-email"),
            PublicAnswerWrite(question_id=questions["Phone"].id, value="12345"),
            PublicAnswerWrite(question_id=questions["Budget"].id, value="many"),
            PublicAnswerWrite(question_id=questions["Use case"].id, value="Invalid"),
            PublicAnswerWrite(question_id=questions["Brand"].id, value="Invalid"),
            PublicAnswerWrite(question_id=questions["Refurbished"].id, value="Maybe"),
            PublicAnswerWrite(question_id=questions["Ease"].id, value="9"),
        ],
        metadata={},
    )

    with pytest.raises(HTTPException) as error:
        submit_public_form(published_form.id, "validation-form", payload, db_session)

    assert error.value.status_code == 422
    details = error.value.detail
    assert "Your name must be 30 characters or fewer." in details
    assert "Email must be a valid email address." in details
    assert "Phone must be a 10 digit phone number." in details
    assert "Budget must be a number." in details
    assert "Use case has an invalid choice." in details
    assert "Brand has an invalid choice." in details
    assert "Refurbished must be Yes or No." in details
    assert "Ease must be between 1 and 5." in details
    assert db_session.query(Response).count() == 0


def test_public_submission_rejects_unknown_and_duplicate_answers(
    db_session: Session,
    published_form: Form,
) -> None:
    payload = answer_payload(db_session)
    payload.answers.append(PublicAnswerWrite(question_id=9999, value="surprise"))
    with pytest.raises(HTTPException) as unknown:
        submit_public_form(published_form.id, "validation-form", payload, db_session)
    assert unknown.value.status_code == 422

    duplicate_payload = answer_payload(db_session)
    duplicate_payload.answers.append(duplicate_payload.answers[0])
    with pytest.raises(HTTPException) as duplicate:
        submit_public_form(published_form.id, "validation-form", duplicate_payload, db_session)
    assert duplicate.value.status_code == 422
    assert duplicate.value.detail == "Submission contains duplicate answers"
