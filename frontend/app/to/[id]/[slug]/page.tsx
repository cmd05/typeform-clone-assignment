"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  demoFlowEndings,
  demoFlowQuestions,
  type AnswerValue,
  RespondentFormFlow,
  type RespondentEnding,
  type RespondentQuestion,
  type RespondentQuestionType
} from "@/components/respondent-form-flow";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

type ApiQuestion = {
  id: number;
  type: RespondentQuestionType;
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

type ApiPublicForm = {
  questions: ApiQuestion[];
  endings: ApiEnding[];
};

export default function SharedFormPage() {
  const params = useParams<{ id: string; slug: string }>();
  const publicPath = `${params.id}/${params.slug}`;
  const [form, setForm] = useState<{
    questions: RespondentQuestion[];
    endings: RespondentEnding[];
  }>({
    questions: demoFlowQuestions,
    endings: demoFlowEndings
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE_URL}/public/forms/${publicPath}`, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load public form");
        return response.json() as Promise<ApiPublicForm>;
      })
      .then((apiForm) => {
        if (cancelled) return;
        setForm({
          questions: apiForm.questions.map(toQuestion),
          endings: apiForm.endings
            .slice()
            .sort((a, b) => a.position - b.position)
            .map(toEnding)
        });
        setError("");
      })
      .catch(() => {
        if (!cancelled) setError("This form is not available.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [publicPath]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbfbfb] text-app-muted">
        Loading form...
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbfbfb] px-6 text-center">
        <div>
          <h1 className="mb-3 text-3xl text-app-text">Form unavailable</h1>
          <p className="text-app-muted">{error}</p>
        </div>
      </main>
    );
  }

  async function submitResponse(answers: Record<string, AnswerValue>) {
    const questionIds = new Set(flattenQuestions(form.questions).map((question) => question.id));
    const payload = {
      answers: Object.entries(answers)
        .filter(([questionId, value]) => questionIds.has(questionId) && !isBlank(value))
        .map(([questionId, value]) => ({
          question_id: Number(questionId),
          value: normalizeAnswer(value)
        })),
      metadata: {
        user_agent: navigator.userAgent
      }
    };

    const response = await fetch(`${API_BASE_URL}/public/forms/${publicPath}/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error("Unable to submit response");
    }
  }

  if (!form.questions.length) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbfbfb] px-6 text-center">
        <div>
          <h1 className="mb-3 text-3xl text-app-text">This form has no questions yet</h1>
          <p className="text-app-muted">Please check back after the creator adds content.</p>
        </div>
      </main>
    );
  }

  return (
    <RespondentFormFlow
      questions={form.questions}
      endings={form.endings}
      onSubmit={submitResponse}
      showRecommendation={params.slug === "laptop-finder"}
    />
  );
}

function flattenQuestions(questions: RespondentQuestion[]): RespondentQuestion[] {
  return questions.flatMap((question) =>
    question.type === "group"
      ? flattenQuestions(question.children ?? [])
      : [question, ...flattenQuestions(question.children ?? [])]
  );
}

function toQuestion(question: ApiQuestion): RespondentQuestion {
  const config = question.config ?? {};
  return {
    id: String(question.id),
    number: String(question.position),
    title: question.title,
    type: question.type,
    description: question.description ?? undefined,
    required: question.required,
    placeholder: asString(config.placeholder),
    phoneCountry: asString(config.phoneCountry),
    ratingCount: asNumber(config.ratingCount),
    choices: question.options
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((option) => option.label),
    children: question.children
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((child, index) => ({
        ...toQuestion(child),
        number: String.fromCharCode(65 + index)
      }))
  };
}

function toEnding(ending: ApiEnding): RespondentEnding {
  return {
    id: String(ending.id),
    letter: String.fromCharCode(65 + Math.max(ending.position - 1, 0)),
    title: ending.title,
    description: ending.description,
    buttonText: ending.button_text,
    imageUrl: ending.image_url ?? ""
  };
}

function asString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function asNumber(value: unknown) {
  return typeof value === "number" ? value : undefined;
}

function normalizeAnswer(value: AnswerValue) {
  if (typeof value === "string") return value.trim();
  return value;
}

function isBlank(value: AnswerValue) {
  if (typeof value === "string") return !value.trim();
  return false;
}
