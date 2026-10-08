"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  Check,
  Copy,
  Gem,
  Grid2X2,
  Link2,
  List,
  MoreHorizontal,
  SlidersHorizontal,
  Trash2,
  X,
  UserPlus
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { FormList } from "@/components/form-list";
import {
  createDashboardForm,
  deleteDashboardForm,
  duplicateDashboardForm,
  fetchDashboardForms,
  publishDashboardForm,
  renameDashboardForm,
  type DashboardForm,
  unpublishDashboardForm
} from "@/lib/forms";
import { mockSession } from "@/lib/session";

export default function DashboardPage() {
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [forms, setForms] = useState<DashboardForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [sharedForm, setSharedForm] = useState<DashboardForm | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DashboardForm | null>(null);
  const [toastMessage, setToastMessage] = useState("");

  async function loadForms() {
    try {
      setError("");
      const nextForms = await fetchDashboardForms();
      setForms(nextForms);
    } catch {
      setError("Backend is not running. Start FastAPI on port 8000 and refresh.");
    } finally {
      setLoading(false);
    }
  }

  async function runAction(action: () => Promise<unknown>, message: string) {
    try {
      setActionMessage("");
      await action();
      await loadForms();
      setActionMessage(message);
    } catch {
      setError("That form action failed. Check the backend server and try again.");
    }
  }

  async function togglePublish(form: DashboardForm) {
    try {
      setActionMessage("");
      setError("");
      if (form.status === "published") {
        await unpublishDashboardForm(form.id);
        await loadForms();
        setActionMessage("Unpublished form.");
        return;
      }

      const publishedForm = await publishDashboardForm(form.id);
      await loadForms();
      setSharedForm(publishedForm);
      setActionMessage("Published form.");
    } catch {
      setError("That form action failed. Check the backend server and try again.");
    }
  }

  function showToast(message: string) {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(""), 1800);
  }

  async function confirmDeleteForm() {
    if (!deleteTarget) return;
    const formToDelete = deleteTarget;
    setDeleteTarget(null);
    await runAction(() => deleteDashboardForm(formToDelete.id), "Deleted form.");
  }

  useEffect(() => {
    loadForms();
  }, []);

  return (
    <AppShell>
      <div className="mx-auto max-w-[1180px] px-10 py-11 max-md:px-4 max-md:py-0">
        <div className="flex items-center justify-between border-b border-app-border pb-5 max-md:h-[50px] max-md:pb-0">
          <div className="relative flex items-center gap-5 max-md:gap-3">
            <button className="hidden icon-button max-md:flex" aria-label="Workspace navigation">
              <List size={18} />
            </button>
            <h1 className="text-[26px] font-normal text-app-text max-md:text-xl">
              {mockSession.workspaceName}
            </h1>
            <button
              className="icon-button"
              aria-label="Workspace menu"
              onClick={() => setWorkspaceMenuOpen((value) => !value)}
              aria-expanded={workspaceMenuOpen}
            >
              <MoreHorizontal size={20} />
            </button>
            {workspaceMenuOpen ? (
              <div className="absolute left-[170px] top-10 z-20 w-52 rounded-xl border border-app-border bg-white p-2 shadow-lg max-md:left-auto max-md:right-0">
                <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-app-muted hover:bg-[#f6f5f6]">
                  Rename workspace
                </button>
                <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-app-muted hover:bg-[#f6f5f6]">
                  Workspace settings
                </button>
                <button
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-app-muted hover:bg-[#f6f5f6]"
                  onClick={() => {
                    setWorkspaceMenuOpen(false);
                    runAction(
                      () => createDashboardForm("Untitled form"),
                      "Created a blank form."
                    );
                  }}
                >
                  Create blank form
                </button>
              </div>
            ) : null}
            <button className="flex items-center gap-2 text-sm font-bold text-app-muted hover:text-app-text max-md:hidden">
              <UserPlus size={17} />
              Invite
            </button>
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#8ed6cb] bg-[#e8fbf8] text-app-teal max-md:hidden">
              <Gem size={15} />
            </span>
          </div>

          <div className="flex items-center gap-3 max-md:hidden">
            <div className="relative">
            <button
              className="flex h-9 items-center gap-2 rounded-lg border border-app-border bg-white px-4 text-sm font-medium text-app-muted hover:bg-[#fafafa]"
              onClick={() => setSortMenuOpen((value) => !value)}
              aria-expanded={sortMenuOpen}
            >
              <CalendarDays size={17} />
              Date created
              <ChevronDown
                size={16}
                className={[
                  "transition-transform",
                  sortMenuOpen ? "rotate-180" : ""
                ].join(" ")}
              />
            </button>
            {sortMenuOpen ? (
              <div className="absolute right-0 top-11 z-20 w-44 rounded-xl border border-app-border bg-white p-2 shadow-lg">
                <button className="w-full rounded-lg bg-[#f6f5f6] px-3 py-2 text-left text-sm font-semibold text-app-text">
                  Date created
                </button>
                <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-app-muted hover:bg-[#f6f5f6]">
                  Last updated
                </button>
                <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-app-muted hover:bg-[#f6f5f6]">
                  Name
                </button>
              </div>
            ) : null}
            </div>
            <div className="flex h-9 overflow-hidden rounded-lg border border-app-border bg-white">
              <button
                className={[
                  "flex items-center gap-2 px-4 text-sm font-semibold",
                  viewMode === "list"
                    ? "bg-[#f1eff2] text-app-text"
                    : "text-app-muted"
                ].join(" ")}
                onClick={() => setViewMode("list")}
              >
                <List size={17} />
                List
              </button>
              <button
                className={[
                  "flex items-center gap-2 border-l border-app-border px-4 text-sm font-semibold",
                  viewMode === "grid"
                    ? "bg-[#f1eff2] text-app-text"
                    : "text-app-muted"
                ].join(" ")}
                onClick={() => setViewMode("grid")}
              >
                <Grid2X2 size={16} />
                Grid
              </button>
            </div>
            <button className="icon-button" aria-label="Filters">
              <SlidersHorizontal size={17} />
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-xl border border-[#f5c2c0] bg-[#fff4f3] px-4 py-3 font-semibold text-[#b42318]">
            {error}
          </div>
        ) : null}
        {actionMessage ? (
          <div className="mt-6 rounded-xl border border-[#bfe4dc] bg-[#f0fffb] px-4 py-3 font-semibold text-app-teal">
            {actionMessage}
          </div>
        ) : null}

        {loading ? (
          <section className="mt-[70px] rounded-xl border border-app-border bg-white px-6 py-12 text-center text-app-muted shadow-soft">
            Loading forms...
          </section>
        ) : (
          <FormList
            forms={forms}
            compactDuplicates={3}
            onDuplicate={(id) =>
              runAction(() => duplicateDashboardForm(id), "Duplicated form.")
            }
            onRename={(form) => {
              const title = window.prompt("Rename form", form.title)?.trim();
              if (!title || title === form.title) return;
              runAction(() => renameDashboardForm(form.id, title), "Renamed form.");
            }}
            onPublishToggle={(form) =>
              togglePublish(form)
            }
            onDelete={(id) => {
              const form = forms.find((item) => item.id === id);
              if (form) setDeleteTarget(form);
            }}
          />
        )}
      </div>
      <DeleteFormModal
        form={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteForm}
      />
      <ShareModal
        form={sharedForm}
        onClose={() => setSharedForm(null)}
        onCopied={() => showToast("Link copied")}
      />
      <CopyToast message={toastMessage} />
    </AppShell>
  );
}

function DeleteFormModal({
  form,
  onCancel,
  onConfirm
}: {
  form: DashboardForm | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <AnimatePresence>
      {form ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#2f2633]/28 px-4 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-[440px] rounded-2xl border border-app-border bg-white p-6 shadow-[0_24px_80px_rgba(47,38,51,0.24)]"
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 18 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-5 flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#fff0f0] text-[#b42318]">
                <Trash2 size={22} />
              </span>
              <div className="min-w-0">
                <h2 className="text-2xl font-bold text-app-text">Delete form?</h2>
                <p className="mt-2 text-sm leading-6 text-app-muted">
                  This will permanently delete <span className="font-semibold text-app-text">{form.title}</span> and its responses.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={onCancel}
                className="h-10 rounded-lg border border-app-border bg-white px-4 font-semibold text-app-muted transition hover:bg-[#f6f5f6]"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="h-10 rounded-lg bg-[#b42318] px-4 font-bold text-white transition hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.98]"
              >
                Delete form
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function ShareModal({
  form,
  onClose,
  onCopied
}: {
  form: DashboardForm | null;
  onClose: () => void;
  onCopied: () => void;
}) {
  const publicUrl =
    form && typeof window !== "undefined"
      ? `${window.location.origin}/to/${form.id}/${form.slug}`
      : "";

  async function copyLink() {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    onCopied();
  }

  return (
    <AnimatePresence>
      {form ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#2f2633]/28 px-4 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-[480px] rounded-2xl border border-app-border bg-white p-6 shadow-[0_24px_80px_rgba(47,38,51,0.24)]"
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 18 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e9fbf6] text-app-teal">
                  <Check size={22} />
                </span>
                <div>
                  <h2 className="text-2xl font-bold text-app-text">Shared form</h2>
                  <p className="mt-1 text-sm font-medium text-app-muted">
                    {form.title} is live and ready to send.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="icon-button shrink-0"
                aria-label="Close share modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="rounded-xl border border-app-border bg-[#f7f7f8] p-3">
              <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-app-muted">
                <Link2 size={14} />
                Public link
              </label>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={publicUrl}
                  className="h-11 min-w-0 flex-1 rounded-lg border border-app-border bg-white px-3 text-sm font-semibold text-app-text outline-none"
                  aria-label="Published form link"
                />
                <button
                  onClick={copyLink}
                  className="flex h-11 shrink-0 items-center gap-2 rounded-lg bg-app-primary px-4 font-bold text-white transition hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.98]"
                >
                  <Copy size={16} />
                  Copy
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function CopyToast({ message }: { message: string }) {
  return (
    <AnimatePresence>
      {message ? (
        <motion.div
          className="fixed right-6 top-6 z-[70] flex items-center gap-3 rounded-xl border border-[#bfe4dc] bg-white px-4 py-3 font-bold text-app-text shadow-[0_16px_50px_rgba(47,38,51,0.18)]"
          initial={{ opacity: 0, y: -12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.96 }}
          transition={{ duration: 0.18 }}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e9fbf6] text-app-teal">
            <Check size={16} />
          </span>
          {message}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
