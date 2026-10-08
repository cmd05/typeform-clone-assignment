import type { BuilderEnding, BuilderQuestion } from "@/components/builder/builder-page";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

type ApiQuestion = {
  id: number;
  type: BuilderQuestion["type"];
  title: string;
  description: string | null;
  required: boolean;
  position: number;
  config: Record<string, unknown>;
  options: { label: string; position: number }[];
  children: ApiQuestion[];
};

type ApiEnding = {
  id: number;
  title: string;
  description: string;
  button_text: string;
  image_url: string | null;
  position: number;
  config: Record<string, unknown>;
};

type ApiForm = {
  id: number;
  title: string;
  slug: string;
  status: "draft" | "published";
  questions: ApiQuestion[];
  endings: ApiEnding[];
};

type CreatedForm = {
  id: number;
  title: string;
  slug: string;
  status?: "draft" | "published";
};

type QuestionPayload = {
  type: BuilderQuestion["type"];
  title: string;
  description: string | null;
  required: boolean;
  position: number;
  config: Record<string, unknown>;
  options: string[];
  children: QuestionPayload[];
};

export async function fetchBuilderForm(formId: string) {
  const response = await fetch(`${API_BASE_URL}/forms/${formId}`, {
    cache: "no-store"
  });
  if (!response.ok) {
    throw new Error("Unable to load form");
  }
  const form = (await response.json()) as ApiForm;
  return {
    id: String(form.id),
    title: form.title,
    slug: form.slug,
    status: form.status,
    questions: form.questions.map(toBuilderQuestion),
    endings: form.endings.map(toBuilderEnding)
  };
}

export async function createBuilderForm(title = "New form", startEmpty = false) {
  const response = await fetch(`${API_BASE_URL}/forms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, start_empty: startEmpty })
  });
  if (!response.ok) {
    throw new Error("Unable to create form");
  }
  const form = (await response.json()) as CreatedForm;
  return {
    id: String(form.id),
    title: form.title,
    slug: form.slug
  };
}

export async function saveBuilderForm({
  formId,
  questions,
  endings
}: {
  formId: string;
  questions: BuilderQuestion[];
  endings: BuilderEnding[];
}) {
  const response = await fetch(`${API_BASE_URL}/forms/${formId}/builder`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      questions: questions.map((question, index) => toQuestionPayload(question, index)),
      endings: endings.map((ending, index) => ({
        title: ending.title,
        description: ending.description,
        button_text: ending.buttonText,
        image_url: ending.imageUrl || null,
        position: index + 1,
        config: {}
      }))
    })
  });
  if (!response.ok) {
    throw new Error("Unable to save form");
  }
}

export async function updateBuilderFormTitle(formId: string, title: string) {
  const response = await fetch(`${API_BASE_URL}/forms/${formId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title })
  });
  if (!response.ok) {
    throw new Error("Unable to rename form");
  }
  const form = (await response.json()) as CreatedForm;
  return {
    id: String(form.id),
    title: form.title,
    slug: form.slug,
    status: form.status ?? "draft"
  };
}

export async function publishBuilderForm(formId: string) {
  const response = await fetch(`${API_BASE_URL}/forms/${formId}/publish`, {
    method: "POST"
  });
  if (!response.ok) {
    throw new Error("Unable to publish form");
  }
  const form = (await response.json()) as CreatedForm;
  return {
    id: String(form.id),
    title: form.title,
    slug: form.slug,
    status: form.status ?? "published"
  };
}

function toBuilderQuestion(question: ApiQuestion): BuilderQuestion {
  const config = question.config ?? {};
  return {
    id: String(question.id),
    number: String(question.position),
    title: question.title,
    type: question.type,
    color: colorForQuestionType(question.type),
    description: question.description ?? undefined,
    placeholder: asString(config.placeholder),
    phoneCountry: asString(config.phoneCountry),
    ratingCount: asNumber(config.ratingCount),
    required: question.required,
    validationEnabled: Boolean(config.validationEnabled),
    maxCharactersEnabled: Boolean(config.maxCharactersEnabled),
    maxCharacters: asNumber(config.maxCharacters),
    choices: question.options
      ?.slice()
      .sort((a, b) => a.position - b.position)
      .map((option) => option.label),
    children: question.children
      ?.slice()
      .sort((a, b) => a.position - b.position)
      .map((child, index) => ({
        ...toBuilderQuestion(child),
        number: String.fromCharCode(65 + index)
      }))
  };
}

function toBuilderEnding(ending: ApiEnding): BuilderEnding {
  return {
    id: String(ending.id),
    letter: String.fromCharCode(65 + Math.max(ending.position - 1, 0)),
    title: ending.title,
    description: ending.description,
    buttonText: ending.button_text,
    imageUrl: ending.image_url ?? ""
  };
}

function toQuestionPayload(
  question: BuilderQuestion,
  index: number
): QuestionPayload {
  return {
    type: question.type,
    title: question.title,
    description: question.description ?? null,
    required: question.required !== false,
    position: index + 1,
    config: {
      placeholder: question.placeholder,
      phoneCountry: question.phoneCountry,
      ratingCount: question.ratingCount,
      validationEnabled: question.validationEnabled,
      maxCharactersEnabled: question.maxCharactersEnabled,
      maxCharacters: question.maxCharacters
    },
    options: question.choices ?? [],
    children: (question.children ?? []).map((child, childIndex) =>
      toQuestionPayload(child, childIndex)
    )
  };
}

function colorForQuestionType(type: BuilderQuestion["type"]) {
  if (type === "group") return "bg-[#e7e5e8]";
  if (type === "short_text" || type === "long_text") return "bg-[#c9e7ff]";
  if (type === "email" || type === "phone") return "bg-[#ffd5e5]";
  if (type === "rating") return "bg-[#d7efcf]";
  return "bg-[#e2d6ff]";
}

function asString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function asNumber(value: unknown) {
  return typeof value === "number" ? value : undefined;
}
