"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, BarChart3, ClipboardList, ExternalLink } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import {
  fetchFormResults,
  type FormResults,
  type ResultResponse,
  type ResultSummary
} from "@/lib/results";

export default function FormResultsPage() {
  const params = useParams<{ id: string }>();
  const [results, setResults] = useState<FormResults | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchFormResults(params.id)
      .then((data) => {
        if (cancelled) return;
        setResults(data);
        setSelectedId(data.responses[0]?.id ?? null);
        setError("");
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load results. Check the backend server.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const selectedResponse = useMemo(
    () => results?.responses.find((response) => response.id === selectedId) ?? null,
    [results, selectedId]
  );

  return (
    <AppShell>
      <main className="mx-auto max-w-[1180px] px-10 py-9 max-md:px-4">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-app-muted hover:text-app-text"
        >
          <ArrowLeft size={16} />
          Back to forms
        </Link>

        {loading ? (
          <EmptyPanel label="Loading results..." />
        ) : error ? (
          <EmptyPanel label={error} danger />
        ) : results ? (
          <>
            <div className="mb-8 flex items-start justify-between gap-5 border-b border-app-border pb-6">
              <div>
                <h1 className="text-[32px] font-normal text-app-text">{results.title}</h1>
                <p className="mt-2 text-app-muted">
                  {results.response_count} response{results.response_count === 1 ? "" : "s"}
                </p>
              </div>
              <Link
                href={`/to/${results.slug}`}
                target="_blank"
                className="flex h-10 shrink-0 items-center gap-2 rounded-lg border border-app-border bg-white px-4 font-bold text-app-muted"
              >
                <ExternalLink size={16} />
                Open form
              </Link>
            </div>

            <section className="mb-8 grid gap-4 lg:grid-cols-3">
              {results.summaries.length ? (
                results.summaries.map((summary) => (
                  <SummaryCard key={summary.question_id} summary={summary} />
                ))
              ) : (
                <div className="rounded-xl border border-app-border bg-white p-5 text-app-muted shadow-soft lg:col-span-3">
                  No choice-style summary data yet.
                </div>
              )}
            </section>

            <section className="grid min-h-[520px] gap-5 lg:grid-cols-[360px_1fr]">
              <div className="overflow-hidden rounded-xl border border-app-border bg-white shadow-soft">
                <div className="flex h-12 items-center gap-2 border-b border-app-border px-4 font-bold text-app-text">
                  <ClipboardList size={17} />
                  Responses
                </div>
                {results.responses.length ? (
                  <div className="max-h-[560px] overflow-y-auto">
                    {results.responses.map((response, index) => (
                      <button
                        key={response.id}
                        onClick={() => setSelectedId(response.id)}
                        className={[
                          "flex w-full items-center justify-between border-b border-app-border px-4 py-3 text-left last:border-b-0",
                          selectedId === response.id ? "bg-[#f2f0f4]" : "hover:bg-[#fafafa]"
                        ].join(" ")}
                      >
                        <span className="font-semibold text-app-text">
                          Response {results.responses.length - index}
                        </span>
                        <span className="text-sm text-app-muted">
                          {formatDateTime(response.submitted_at)}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="p-5 text-app-muted">No responses yet.</p>
                )}
              </div>

              <ResponseDetail response={selectedResponse} />
            </section>
          </>
        ) : null}
      </main>
    </AppShell>
  );
}

function SummaryCard({ summary }: { summary: ResultSummary }) {
  const entries = Object.entries(summary.counts);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  return (
    <div className="rounded-xl border border-app-border bg-white p-5 shadow-soft">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eee9f8] text-app-primary">
          <BarChart3 size={18} />
        </span>
        <div className="min-w-0">
          <h2 className="truncate font-bold text-app-text">{summary.title}</h2>
          <p className="text-sm text-app-muted">{total} answer{total === 1 ? "" : "s"}</p>
        </div>
      </div>
      <div className="space-y-3">
        {entries.length ? (
          entries.map(([label, count]) => {
            const width = total ? Math.round((count / total) * 100) : 0;
            return (
              <div key={label}>
                <div className="mb-1 flex justify-between gap-3 text-sm font-semibold">
                  <span className="truncate text-app-text">{label}</span>
                  <span className="text-app-muted">{count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#efedf1]">
                  <div
                    className="h-full rounded-full bg-app-primary"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-app-muted">No answers yet.</p>
        )}
      </div>
    </div>
  );
}

function ResponseDetail({ response }: { response: ResultResponse | null }) {
  if (!response) {
    return (
      <div className="rounded-xl border border-app-border bg-white p-8 text-center text-app-muted shadow-soft">
        Select a response to view its answers.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-app-border bg-white shadow-soft">
      <div className="border-b border-app-border px-6 py-5">
        <h2 className="text-xl font-bold text-app-text">Response #{response.id}</h2>
        <p className="mt-1 text-sm text-app-muted">
          Submitted {formatDateTime(response.submitted_at)}
        </p>
      </div>
      <div className="divide-y divide-app-border">
        {response.answers.length ? (
          response.answers.map((answer) => (
            <div key={`${response.id}-${answer.question_id}`} className="px-6 py-5">
              <p className="mb-2 text-sm font-bold text-app-muted">{answer.title}</p>
              <p className="text-lg text-app-text">{formatValue(answer.value)}</p>
            </div>
          ))
        ) : (
          <p className="p-6 text-app-muted">This response has no saved answers.</p>
        )}
      </div>
    </div>
  );
}

function EmptyPanel({ label, danger = false }: { label: string; danger?: boolean }) {
  return (
    <section
      className={[
        "rounded-xl border bg-white px-6 py-12 text-center font-semibold shadow-soft",
        danger ? "border-[#f5c2c0] text-[#b42318]" : "border-app-border text-app-muted"
      ].join(" ")}
    >
      {label}
    </section>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatValue(value: unknown) {
  if (value == null || value === "") return "No answer";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
