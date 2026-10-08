import Link from "next/link";
import {
  Copy,
  ExternalLink,
  Grid2X2,
  MoreHorizontal,
  Pencil,
  Trash2
} from "lucide-react";
import { useState } from "react";
import type { DashboardForm } from "@/lib/forms";

function FormTileIcon() {
  return (
    <div className="flex h-9 w-9 overflow-hidden rounded-[10px] bg-[#5b8db8]">
      <div className="h-full w-1/2 bg-[#497ca8]" />
      <div className="h-full w-1/2 bg-[#699bc4]" />
    </div>
  );
}

function formatFormStatus(status: DashboardForm["status"]) {
  return status === "published" ? "Published" : "Draft";
}

export function FormList({
  forms,
  compactDuplicates = 1,
  onDuplicate,
  onRename,
  onPublishToggle,
  onDelete
}: {
  forms: DashboardForm[];
  compactDuplicates?: number;
  onDuplicate?: (id: string) => void;
  onRename?: (form: DashboardForm) => void;
  onPublishToggle?: (form: DashboardForm) => void;
  onDelete?: (id: string) => void;
}) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const mobileForms = forms.slice(0, compactDuplicates);

  if (!forms.length) {
    return (
      <section className="mt-[70px] rounded-xl border border-dashed border-app-border bg-white px-6 py-12 text-center text-app-muted shadow-soft max-md:mt-[60px]">
        No forms yet. Create one to get started.
      </section>
    );
  }

  return (
    <section className="mt-[70px] max-md:mt-[60px]">
      <div className="grid grid-cols-[minmax(280px,1fr)_120px_120px_120px_120px_54px] px-3 pb-4 text-sm text-app-muted max-md:hidden">
        <div />
        <div className="text-center">Responses</div>
        <div className="text-center">Completed</div>
        <div>Updated</div>
        <div>Integrations</div>
        <div />
      </div>

      <div className="rounded-xl border border-app-border bg-white shadow-soft max-md:hidden">
        {forms.map((form) => (
          <div
            key={form.id}
            className="grid h-[48px] grid-cols-[minmax(280px,1fr)_120px_120px_120px_120px_54px] items-center border-b border-app-border px-3 text-[15px] transition last:border-b-0 hover:bg-[#fafafa]"
          >
            <Link
              href={`/forms/${form.id}/edit`}
              className="flex min-w-0 items-center gap-3"
            >
              <FormTileIcon />
              <span className="min-w-0 truncate font-semibold text-app-text">
                {form.title}
              </span>
              <span
                className={[
                  "rounded-md px-2 py-0.5 text-xs font-normal",
                  form.status === "published"
                    ? "bg-[#e0f3df] text-[#35763c]"
                    : "bg-[#f1eff2] text-app-muted"
                ].join(" ")}
              >
                {formatFormStatus(form.status)}
              </span>
            </Link>
            <Link
              href={`/forms/${form.id}/results`}
              className="text-center font-semibold text-app-muted hover:text-app-primary"
            >
              {form.responses ?? "-"}
            </Link>
            <div className="text-center text-[#bab4bf]">
              {form.completed ?? "-"}
            </div>
            <div className="text-app-muted">{form.updatedAt}</div>
            <div>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-app-border text-app-muted">
                <Grid2X2 size={16} />
              </span>
            </div>
            <div className="relative flex justify-end">
              <button
                className="icon-button"
                onClick={() =>
                  setOpenMenuId((current) => (current === form.id ? null : form.id))
                }
                aria-label={`Open actions for ${form.title}`}
              >
                <MoreHorizontal size={18} />
              </button>
              {openMenuId === form.id ? (
                <FormActionsMenu
                  form={form}
                  onDuplicate={() => {
                    setOpenMenuId(null);
                    onDuplicate?.(form.id);
                  }}
                  onRename={() => {
                    setOpenMenuId(null);
                    onRename?.(form);
                  }}
                  onPublishToggle={() => {
                    setOpenMenuId(null);
                    onPublishToggle?.(form);
                  }}
                  onDelete={() => {
                    setOpenMenuId(null);
                    onDelete?.(form.id);
                  }}
                />
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div className="hidden space-y-2 max-md:block">
        {mobileForms.map((form) => (
          <Link
            key={form.id}
            href={`/forms/${form.id}/edit`}
            className="flex h-[41px] items-center gap-3 rounded-xl border border-app-border bg-white px-3 shadow-soft"
          >
            <FormTileIcon />
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-app-text">
              {form.title}
            </span>
            <span className="rounded-md bg-[#f1eff2] px-2 py-0.5 text-xs font-bold text-app-muted">
              {form.responses ?? 0}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function FormActionsMenu({
  form,
  onDuplicate,
  onRename,
  onPublishToggle,
  onDelete
}: {
  form: DashboardForm;
  onDuplicate: () => void;
  onRename: () => void;
  onPublishToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="absolute right-0 top-10 z-50 w-48 rounded-xl border border-app-border bg-white p-2 text-sm shadow-lg">
      <button
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left font-semibold text-app-muted hover:bg-[#f6f5f6]"
        onClick={onDuplicate}
      >
        <Copy size={15} />
        Duplicate
      </button>
      <button
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left font-semibold text-app-muted hover:bg-[#f6f5f6]"
        onClick={onRename}
      >
        <Pencil size={15} />
        Rename
      </button>
      <button
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left font-semibold text-app-muted hover:bg-[#f6f5f6]"
        onClick={onPublishToggle}
      >
        <ExternalLink size={15} />
        {form.status === "published" ? "Unpublish" : "Publish"}
      </button>
      <button
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left font-semibold text-[#b42318] hover:bg-[#fff0f0]"
        onClick={onDelete}
      >
        <Trash2 size={15} />
        Delete
      </button>
    </div>
  );
}
