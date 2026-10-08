const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export type ResultQuestion = {
  id: number;
  type: string;
  title: string;
  position: number;
  options: string[];
};

export type ResultAnswer = {
  question_id: number;
  title: string;
  value: unknown;
};

export type ResultResponse = {
  id: number;
  submitted_at: string;
  answers: ResultAnswer[];
};

export type ResultSummary = {
  question_id: number;
  title: string;
  type: string;
  counts: Record<string, number>;
};

export type FormResults = {
  form_id: number;
  title: string;
  slug: string;
  response_count: number;
  questions: ResultQuestion[];
  responses: ResultResponse[];
  summaries: ResultSummary[];
};

export async function fetchFormResults(formId: string): Promise<FormResults> {
  const response = await fetch(`${API_BASE_URL}/forms/${formId}/results?t=${Date.now()}`, {
    cache: "no-store"
  });
  if (!response.ok) {
    throw new Error("Unable to load form results");
  }
  return response.json();
}
