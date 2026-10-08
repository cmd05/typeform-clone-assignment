export type DashboardForm = {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  updatedAt: string;
  responses: number | null;
  completed: number | null;
  integrations: number;
};

type ApiFormListItem = {
  id: number;
  title: string;
  slug: string;
  status: "draft" | "published";
  response_count: number;
  updated_at: string;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export async function fetchDashboardForms(): Promise<DashboardForm[]> {
  const response = await fetch(`${API_BASE_URL}/forms`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to load forms");
  }
  const forms = (await response.json()) as ApiFormListItem[];
  return forms.map(toDashboardForm);
}

export async function createDashboardForm(title = "Untitled form") {
  return toDashboardForm(await mutateForm("/forms", {
    method: "POST",
    body: JSON.stringify({ title })
  }));
}

export async function renameDashboardForm(id: string, title: string) {
  return toDashboardForm(await mutateForm(`/forms/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ title })
  }));
}

export async function duplicateDashboardForm(id: string) {
  return toDashboardForm(await mutateForm(`/forms/${id}/duplicate`, { method: "POST" }));
}

export async function publishDashboardForm(id: string) {
  return toDashboardForm(await mutateForm(`/forms/${id}/publish`, { method: "POST" }));
}

export async function unpublishDashboardForm(id: string) {
  return toDashboardForm(await mutateForm(`/forms/${id}/unpublish`, { method: "POST" }));
}

export async function deleteDashboardForm(id: string) {
  const response = await fetch(`${API_BASE_URL}/forms/${id}`, {
    method: "DELETE"
  });
  if (!response.ok) {
    throw new Error("Unable to delete form");
  }
}

async function mutateForm(path: string, init: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers
    }
  });
  if (!response.ok) {
    throw new Error("Form action failed");
  }
  return response.json();
}

function toDashboardForm(form: ApiFormListItem): DashboardForm {
  return {
    id: String(form.id),
    title: form.title,
    slug: form.slug,
    status: form.status,
    updatedAt: formatDate(form.updated_at),
    responses: form.response_count,
    completed: form.response_count,
    integrations: 0
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}
