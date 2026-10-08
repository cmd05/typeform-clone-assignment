from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import Answer, Form, FormEnding, Question, QuestionOption, Response


def seed_database(db: Session) -> None:
    seed_laptop_finder(db)
    seed_simple_form(
        db,
        slug="team-retro-check-in",
        title="Team Retro Check-in",
        status="published",
        questions=[
            {
                "type": "short_text",
                "title": "What went well this sprint?",
                "description": "Share one highlight.",
                "config": {"placeholder": "We shipped..."},
            },
            {
                "type": "long_text",
                "title": "What slowed the team down?",
                "description": "Add blockers, unclear decisions, or process friction.",
                "config": {"placeholder": "The main blocker was..."},
            },
            {
                "type": "rating",
                "title": "How would you rate the sprint?",
                "config": {"ratingCount": 5},
                "options": ["1", "2", "3", "4", "5"],
            },
            {
                "type": "multiple_choice",
                "title": "What should we focus on next?",
                "options": ["Planning", "Code quality", "Communication", "Delivery speed"],
            },
        ],
    )
    seed_simple_form(
        db,
        slug="event-feedback",
        title="Event Feedback",
        status="draft",
        questions=[
            {
                "type": "rating",
                "title": "How was the event overall?",
                "config": {"ratingCount": 5},
                "options": ["1", "2", "3", "4", "5"],
            },
            {
                "type": "multiple_choice",
                "title": "Which session type did you enjoy most?",
                "options": ["Workshop", "Talk", "Panel", "Networking"],
            },
            {
                "type": "long_text",
                "title": "What should we improve next time?",
                "config": {"placeholder": "Tell us what would make it better."},
            },
            {
                "type": "yes_no",
                "title": "Would you attend another event like this?",
                "options": ["Yes", "No"],
            },
        ],
    )
    seed_simple_form(
        db,
        slug="product-research-pulse",
        title="Product Research Pulse",
        status="published",
        questions=[
            {
                "type": "multiple_choice",
                "title": "Which product area did you use recently?",
                "options": ["Dashboard", "Builder", "Sharing", "Results"],
            },
            {
                "type": "dropdown",
                "title": "How often do you use it?",
                "options": ["Daily", "Weekly", "Monthly", "Rarely"],
            },
            {
                "type": "rating",
                "title": "How easy was it to complete your task?",
                "config": {"ratingCount": 5},
                "options": ["1", "2", "3", "4", "5"],
            },
            {
                "type": "long_text",
                "title": "What would make the product better?",
                "config": {"placeholder": "One improvement I would suggest is..."},
            },
        ],
    )
    db.flush()
    reseed_dummy_responses(db)
    db.commit()


def seed_laptop_finder(db: Session) -> None:
    existing = db.scalar(select(Form).where(Form.slug == "laptop-finder"))
    if existing:
        ensure_laptop_endings(db, existing.id)
        return

    form = Form(
        title="Laptop Finder",
        slug="laptop-finder",
        status="published",
        published_at=datetime.now(timezone.utc),
    )
    db.add(form)
    db.flush()

    details = Question(
        form_id=form.id,
        type="group",
        title="Your details",
        description="Description (optional)",
        required=True,
        position=1,
        config={},
    )
    db.add(details)
    db.flush()

    db.add_all(
        [
            Question(
                form_id=form.id,
                parent_id=details.id,
                type="short_text",
                title="What's your name?",
                required=True,
                position=1,
                config={"placeholder": "Your full name"},
            ),
            Question(
                form_id=form.id,
                parent_id=details.id,
                type="email",
                title="What's your email address?",
                required=True,
                position=2,
                config={"placeholder": "you@example.com"},
            ),
        ]
    )

    audience = add_question(
        db,
        form.id,
        "multiple_choice",
        "Who is this laptop for?",
        2,
        "Description (optional)",
        ["For me", "For a student", "For work or my business", "As a gift"],
    )
    budget = add_question(
        db,
        form.id,
        "multiple_choice",
        "What's your budget in INR?",
        3,
        "Description (optional)",
        ["Under 40000", "40000-60000", "60000-80000", "Above 80000"],
    )
    refurbished = add_question(
        db,
        form.id,
        "yes_no",
        "Would you consider a certified refurbished laptop?",
        4,
        None,
        ["Yes", "No"],
    )
    brand = add_question(
        db,
        form.id,
        "dropdown",
        "Do you have a preferred brand?",
        5,
        None,
        [
            "Lenovo",
            "ASUS",
            "HP",
            "Dell",
            "Acer",
            "Apple",
            "MSI",
            "Samsung",
            "No preference",
        ],
    )

    ensure_laptop_endings(db, form.id)

    db.flush()


def ensure_laptop_endings(db: Session, form_id: int) -> None:
    endings = [
        {
            "title": "Your match: Lenovo IdeaPad Slim 3",
            "description": (
                "A reliable 15.6-inch everyday laptop for study, browsing and "
                "office tasks. Suggested configuration: Ryzen 5, 16 GB RAM and "
                "512 GB SSD. InfiniLaptops will confirm the best discounted "
                "price in your budget."
            ),
            "button_text": "Explore more deals",
            "image_url": None,
            "config": {"recommendationKey": "ideapad-slim-3", "budget": "Under 40000"},
        },
        {
            "title": "Your match: ASUS Vivobook 16",
            "description": (
                "A larger-screen everyday laptop for multitasking, study, and "
                "comfortable office work. Suggested configuration: Ryzen 5 or "
                "Intel i5, 16 GB RAM and 512 GB SSD. InfiniLaptops will confirm "
                "the best discounted price in your budget."
            ),
            "button_text": "Explore more deals",
            "image_url": None,
            "config": {"recommendationKey": "vivobook-16", "budget": "40000-60000"},
        },
        {
            "title": "Your match: Lenovo LOQ 15",
            "description": (
                "A performance-focused laptop for gaming, creator tools, and "
                "heavier workloads. Suggested configuration: RTX graphics, 16 GB "
                "RAM and 512 GB SSD. InfiniLaptops will confirm the best "
                "discounted price in your budget."
            ),
            "button_text": "Explore more deals",
            "image_url": None,
            "config": {"recommendationKey": "lenovo-loq-15", "budget": "60000-80000"},
        },
        {
            "title": "Your match: ASUS TUF Gaming F15",
            "description": (
                "A durable high-performance pick for gaming and demanding work. "
                "Suggested configuration: Intel i7 or Ryzen 7, RTX graphics, "
                "16 GB RAM and 1 TB SSD. InfiniLaptops will confirm the best "
                "discounted price in your budget."
            ),
            "button_text": "Explore more deals",
            "image_url": None,
            "config": {"recommendationKey": "asus-tuf-f15", "budget": "Above 80000"},
        },
    ]

    target_keys = {item["config"]["recommendationKey"] for item in endings}
    existing_by_key: dict[str, FormEnding] = {}
    for ending in db.scalars(select(FormEnding).where(FormEnding.form_id == form_id)):
        key = (ending.config or {}).get("recommendationKey")
        if key not in target_keys or key in existing_by_key:
            db.delete(ending)
            continue
        existing_by_key[key] = ending

    for position, item in enumerate(endings, start=1):
        key = item["config"]["recommendationKey"]
        ending = existing_by_key.get(key)
        if ending:
            ending.title = item["title"]
            ending.description = item["description"]
            ending.button_text = item["button_text"]
            ending.image_url = item["image_url"]
            ending.position = position
            ending.config = item["config"]
            continue

        db.add(
            FormEnding(
                form_id=form_id,
                title=item["title"],
                description=item["description"],
                button_text=item["button_text"],
                image_url=item["image_url"],
                position=position,
                config=item["config"],
            )
        )


def seed_simple_form(
    db: Session,
    slug: str,
    title: str,
    status: str,
    questions: list[dict],
) -> None:
    if db.scalar(select(Form).where(Form.slug == slug)):
        return

    form = Form(
        title=title,
        slug=slug,
        status=status,
        published_at=datetime.now(timezone.utc) if status == "published" else None,
    )
    db.add(form)
    db.flush()

    created_questions: list[Question] = []
    for position, item in enumerate(questions, start=1):
        question = add_question(
            db,
            form.id,
            item["type"],
            item["title"],
            position,
            item.get("description"),
            item.get("options", []),
            item.get("config", {}),
        )
        created_questions.append(question)

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
    db.flush()

def reseed_dummy_responses(db: Session) -> None:
    for response in db.scalars(select(Response)):
        db.delete(response)
    db.flush()

    forms = db.scalars(
        select(Form).options(
            selectinload(Form.questions).selectinload(Question.options),
            selectinload(Form.questions).selectinload(Question.children).selectinload(Question.options),
        )
    ).all()

    for form in forms:
        seed_dummy_responses_for_form(db, form.id)


def seed_dummy_responses_for_form(db: Session, form_id: int) -> None:
    for response in db.scalars(select(Response).where(Response.form_id == form_id)):
        db.delete(response)
    db.flush()

    form = db.scalar(
        select(Form)
        .where(Form.id == form_id)
        .options(
            selectinload(Form.questions).selectinload(Question.options),
            selectinload(Form.questions).selectinload(Question.children).selectinload(Question.options),
        )
    )
    if not form:
        return

    questions = flatten_questions([question for question in form.questions if question.parent_id is None])
    if not questions:
        return

    for index in range(6):
        response = Response(
            form_id=form.id,
            metadata_json={
                "seed": True,
                "source": "dummy logical response seed",
                "persona": index + 1,
            },
        )
        db.add(response)
        db.flush()

        for question in questions:
            value = seeded_answer_for_question(form.slug, question, index)
            if value is None:
                continue
            db.add(
                Answer(
                    response_id=response.id,
                    question_id=question.id,
                    value={"value": value},
                )
            )


def flatten_questions(questions: list[Question]) -> list[Question]:
    flattened: list[Question] = []
    for question in questions:
        if question.type != "group":
            flattened.append(question)
        flattened.extend(flatten_questions(list(question.children)))
    return flattened


def add_question(
    db: Session,
    form_id: int,
    question_type: str,
    title: str,
    position: int,
    description: str | None = None,
    options: list[str] | None = None,
    config: dict | None = None,
) -> Question:
    question = Question(
        form_id=form_id,
        type=question_type,
        title=title,
        description=description,
        required=True,
        position=position,
        config=config or {},
    )
    db.add(question)
    db.flush()

    for index, label in enumerate(options or [], start=1):
        db.add(
            QuestionOption(
                question_id=question.id,
                label=label,
                value=label,
                position=index,
            )
        )

    return question


def seeded_answer_for_question(form_slug: str, question: Question, index: int) -> str | None:
    title = question.title.lower()
    option_values = [option.value for option in question.options]

    if question.type in {"statement", "welcome"}:
        return None
    if question.type == "email":
        return pick(
            [
                "ananya@example.com",
                "rahul@example.com",
                "meera@example.com",
                "arjun@example.com",
                "priya@example.com",
                "kabir@example.com",
            ],
            index,
        )
    if question.type == "phone":
        return pick(
            ["9876543210", "9123456780", "9988776655", "9090909090", "9812345678", "9700012345"],
            index,
        )
    if "name" in title:
        return pick(["Ananya Rao", "Rahul Mehta", "Meera Iyer", "Arjun Singh", "Priya Nair", "Kabir Shah"], index)
    if question.type == "rating":
        return pick(["4", "5", "3", "4", "5", "4"], index)
    if option_values:
        return seeded_option_answer(form_slug, title, option_values, index)
    if question.type == "number":
        return pick(["12", "24", "36", "48", "60", "72"], index)
    if "went well" in title:
        return pick(
            [
                "Planning was clearer and the team shipped the main stories.",
                "QA feedback came earlier than usual.",
                "Pairing helped us unblock the dashboard work.",
                "The release checklist kept everyone aligned.",
                "Design handoff was smooth.",
                "We finished the highest priority tickets.",
            ],
            index,
        )
    if "slowed" in title or "blocker" in title:
        return pick(
            [
                "A late API change caused some rework.",
                "We had a few unclear ownership boundaries.",
                "Review cycles took longer than expected.",
                "Test data was not ready on day one.",
                "A dependency update broke local setup.",
                "Some edge cases were discovered late.",
            ],
            index,
        )
    if "improve" in title or "better" in title:
        return pick(
            [
                "More examples and clearer onboarding would help.",
                "I would like faster search and fewer clicks.",
                "Better mobile layouts would make this easier.",
                "A saved filters feature would be useful.",
                "More keyboard shortcuts would speed up repeat work.",
                "I would like clearer status messages after sharing.",
            ],
            index,
        )
    if "goal" in title:
        return pick(
            [
                "I want a practical plan that fits around work.",
                "I am focused on improving consistency.",
                "I want to build strength without overtraining.",
                "I need better accountability week to week.",
                "I want simple progress tracking.",
                "I need guidance on where to start.",
            ],
            index,
        )
    return pick(
        [
            "This answer feels complete.",
            "A concise but useful response.",
            "The experience was straightforward.",
            "I would recommend this to someone else.",
            "Everything worked as expected.",
            "This matched what I needed.",
        ],
        index,
    )


def seeded_option_answer(form_slug: str, title: str, options: list[str], index: int) -> str:
    if form_slug == "laptop-finder":
        if "who is this laptop" in title:
            return pick(["For me", "For a student", "For work or my business", "As a gift", "For a student", "For me"], index)
        if "budget" in title:
            return pick(["Under 40000", "40000-60000", "60000-80000", "Above 80000", "40000-60000", "60000-80000"], index)
        if "refurbished" in title:
            return pick(["Yes", "No", "Yes", "No", "Yes", "Yes"], index)
        if "brand" in title:
            return pick(["Lenovo", "ASUS", "HP", "Dell", "No preference", "Apple"], index)
    if form_slug == "team-retro-check-in" and "focus" in title:
        return pick(["Planning", "Code quality", "Communication", "Delivery speed", "Code quality", "Planning"], index)
    if form_slug == "event-feedback":
        if "session type" in title:
            return pick(["Workshop", "Talk", "Panel", "Networking", "Workshop", "Talk"], index)
        if "attend another" in title:
            return pick(["Yes", "Yes", "No", "Yes", "Yes", "Yes"], index)
    if form_slug == "product-research-pulse":
        if "product area" in title:
            return pick(["Dashboard", "Builder", "Sharing", "Results", "Builder", "Results"], index)
        if "how often" in title:
            return pick(["Daily", "Weekly", "Monthly", "Weekly", "Daily", "Rarely"], index)

    return options[index % len(options)]


def pick(values: list[str], index: int) -> str:
    return values[index % len(values)]
