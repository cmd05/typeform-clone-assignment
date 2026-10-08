from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class QuestionOptionRead(BaseModel):
    id: int
    label: str
    value: str
    position: int

    model_config = ConfigDict(from_attributes=True)


class QuestionRead(BaseModel):
    id: int
    parent_id: int | None
    type: str
    title: str
    description: str | None
    required: bool
    position: int
    config: dict[str, Any]
    options: list[QuestionOptionRead] = []
    children: list["QuestionRead"] = []

    model_config = ConfigDict(from_attributes=True)


class FormEndingRead(BaseModel):
    id: int
    title: str
    description: str
    button_text: str
    image_url: str | None
    position: int
    config: dict[str, Any]

    model_config = ConfigDict(from_attributes=True)


class FormListItem(BaseModel):
    id: int
    title: str
    slug: str
    status: str
    response_count: int
    created_at: datetime
    updated_at: datetime
    published_at: datetime | None


class FormRead(FormListItem):
    questions: list[QuestionRead]
    endings: list[FormEndingRead]


class FormCreate(BaseModel):
    title: str = "Untitled form"
    start_empty: bool = False


class FormUpdate(BaseModel):
    title: str | None = None


class BuilderQuestionWrite(BaseModel):
    type: str
    title: str
    description: str | None = None
    required: bool = True
    position: int
    config: dict[str, Any] = {}
    options: list[str] = []
    children: list["BuilderQuestionWrite"] = []


class BuilderEndingWrite(BaseModel):
    title: str
    description: str
    button_text: str
    image_url: str | None = None
    position: int
    config: dict[str, Any] = {}


class BuilderSave(BaseModel):
    questions: list[BuilderQuestionWrite]
    endings: list[BuilderEndingWrite]


class PublicFormRead(BaseModel):
    title: str
    slug: str
    questions: list[QuestionRead]
    endings: list[FormEndingRead]


class PublicAnswerWrite(BaseModel):
    question_id: int
    value: Any


class PublicSubmissionCreate(BaseModel):
    answers: list[PublicAnswerWrite]
    metadata: dict[str, Any] = {}


class PublicSubmissionRead(BaseModel):
    id: int
    submitted_at: datetime


class ResultQuestionRead(BaseModel):
    id: int
    type: str
    title: str
    position: int
    options: list[str] = []


class ResultAnswerRead(BaseModel):
    question_id: int
    title: str
    value: Any


class ResultResponseRead(BaseModel):
    id: int
    submitted_at: datetime
    answers: list[ResultAnswerRead]


class ResultSummaryItem(BaseModel):
    question_id: int
    title: str
    type: str
    counts: dict[str, int]


class FormResultsRead(BaseModel):
    form_id: int
    title: str
    slug: str
    response_count: int
    questions: list[ResultQuestionRead]
    responses: list[ResultResponseRead]
    summaries: list[ResultSummaryItem]


QuestionRead.model_rebuild()
BuilderQuestionWrite.model_rebuild()
