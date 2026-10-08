from collections.abc import Generator

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.models import Form, FormEnding, Question, QuestionOption


@pytest.fixture()
def testing_session_local() -> Generator[sessionmaker[Session], None, None]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    yield TestingSessionLocal

    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db_session(testing_session_local: sessionmaker[Session]) -> Generator[Session, None, None]:
    with testing_session_local() as session:
        yield session
@pytest.fixture()
def published_form(db_session: Session) -> Form:
    form = Form(title="Validation Form", slug="validation-form", status="published")
    db_session.add(form)
    db_session.flush()

    questions = [
        Question(
            form_id=form.id,
            type="short_text",
            title="Your name",
            required=True,
            position=1,
            config={"maxCharactersEnabled": True, "maxCharacters": 30},
        ),
        Question(
            form_id=form.id,
            type="email",
            title="Email",
            required=True,
            position=2,
            config={},
        ),
        Question(
            form_id=form.id,
            type="phone",
            title="Phone",
            required=True,
            position=3,
            config={},
        ),
        Question(
            form_id=form.id,
            type="number",
            title="Budget",
            required=True,
            position=4,
            config={},
        ),
        Question(
            form_id=form.id,
            type="multiple_choice",
            title="Use case",
            required=True,
            position=5,
            config={},
        ),
        Question(
            form_id=form.id,
            type="dropdown",
            title="Brand",
            required=True,
            position=6,
            config={},
        ),
        Question(
            form_id=form.id,
            type="yes_no",
            title="Refurbished",
            required=True,
            position=7,
            config={},
        ),
        Question(
            form_id=form.id,
            type="rating",
            title="Ease",
            required=True,
            position=8,
            config={"ratingCount": 5},
        ),
    ]
    db_session.add_all(questions)
    db_session.flush()

    options = [
        QuestionOption(question_id=questions[4].id, label="Study", value="Study", position=1),
        QuestionOption(question_id=questions[4].id, label="Gaming", value="Gaming", position=2),
        QuestionOption(question_id=questions[5].id, label="Lenovo", value="Lenovo", position=1),
        QuestionOption(question_id=questions[5].id, label="No preference", value="No preference", position=2),
    ]
    db_session.add_all(options)
    db_session.add(
        FormEnding(
            form_id=form.id,
            title="Thank you",
            description="Done",
            button_text="Done",
            image_url=None,
            position=1,
            config={},
        )
    )
    db_session.commit()
    db_session.refresh(form)
    return form
