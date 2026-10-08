"use client";

import Link from "next/link";
import {
  Check,
  CircleHelp,
  Mail,
  Mic,
  MoreHorizontal,
  Phone,
  Plus,
  SendHorizontal,
  Sparkles,
  Text,
  X
} from "lucide-react";
import { useState } from "react";
import { UserAvatar } from "@/components/avatar";
import { mockSession } from "@/lib/session";

const previewQuestions = [
  {
    number: "2",
    icon: Mail,
    color: "bg-[#ffd8e8]",
    title: "What's the best email address to reach you?"
  },
  {
    number: "3",
    icon: Phone,
    color: "bg-[#ffd8e8]",
    title: "What is your phone number?"
  },
  {
    number: "4",
    icon: Text,
    color: "bg-[#cbe7fb]",
    title: "Briefly describe your fitness goals."
  },
  {
    number: "5",
    label: "A=",
    color: "bg-[#e4d8ff]",
    title: "How would you describe your current activity level?",
    choices: [
      "Not active",
      "Occasionally active",
      "Active several times a week",
      "Very active"
    ]
  },
  {
    number: "6",
    label: "A=",
    color: "bg-[#e4d8ff]",
    title: "What training format do you prefer?",
    choices: ["In-person", "Online", "A mix of both"]
  },
  {
    number: "7",
    label: "A=",
    color: "bg-[#e4d8ff]",
    title: "How often would you like to train per week?",
    choices: ["Once a week", "2-3 times a week", "4 or more times a week"]
  }
];

export default function NewFormPage() {
  const [sampleOpen, setSampleOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <header className="flex h-12 items-center justify-between border-b border-[#f1eff2] px-5">
        <div className="flex items-center gap-2 text-[15px] font-semibold text-app-muted">
          <Link href="/" className="hover:text-app-text">
            Forms
          </Link>
          <span>›</span>
          <span className="border-b border-app-text text-app-text">New form</span>
        </div>
        <div className="flex items-center gap-5">
          <div className="h-6 w-px bg-app-border" />
          <button className="icon-button" aria-label="Help">
            <CircleHelp size={18} />
          </button>
          <UserAvatar initial={mockSession.userInitial} />
        </div>
      </header>

      <main className="p-1">
        <section className="flex min-h-[calc(100vh-56px)] items-center justify-center rounded-xl bg-[#f7f7f8]">
          <div className="mb-16 flex w-full max-w-[510px] flex-col items-center px-6">
            <div className="mb-3 text-sm font-bold text-app-muted">
              Typeform AI
            </div>
            <h1 className="mb-8 text-center text-[25px] font-normal text-app-text">
              What would you like to create?
            </h1>

            <div className="w-full rounded-xl border border-[#c48ddc] bg-white p-3 shadow-focus">
              <textarea
                className="h-[118px] w-full resize-none rounded-md border-0 bg-transparent p-1 text-app-text outline-none placeholder:text-[#a49da8]"
                aria-label="Describe the form you want to create"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-app-muted">
                  <Mic size={18} />
                  <Plus size={18} />
                  <MoreHorizontal size={18} />
                </div>
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-app-border bg-[#fafafa] text-[#c5bdc9]"
                  aria-label="Generate form"
                >
                  <SendHorizontal size={17} />
                </button>
              </div>
            </div>

            <div className="my-11 h-px w-[88%] bg-app-border" />

            <div className="grid w-[92%] grid-cols-2 gap-4">
              <Link
                href="/forms/new/builder"
                className="flex h-11 items-center justify-center rounded-xl bg-[#efeff0] text-sm font-bold text-app-muted hover:bg-[#e8e8ea]"
              >
                Start from scratch
              </Link>
              <button
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#efeff0] text-sm font-bold text-app-muted hover:bg-[#e8e8ea]"
                onClick={() => setSampleOpen(true)}
              >
                <Sparkles size={16} />
                See AI sample
              </button>
            </div>
          </div>
        </section>
      </main>

      {sampleOpen ? <AiSampleModal onClose={() => setSampleOpen(false)} /> : null}
    </div>
  );
}

function AiSampleModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 py-6">
      <div className="flex h-[680px] w-full max-w-[920px] overflow-hidden rounded-xl border border-[#d8d1dc] bg-white shadow-2xl max-md:h-[calc(100vh-32px)] max-md:flex-col">
        <aside className="flex w-[370px] shrink-0 flex-col border-r border-app-border bg-white p-5 max-md:h-[42%] max-md:w-full max-md:border-b max-md:border-r-0">
          <div className="mb-16 flex items-center gap-2 text-[16px] font-bold text-app-text max-md:mb-5">
            <Sparkles size={18} className="text-[#8d38aa]" />
            Typeform AI
            <span className="rounded-md border border-[#d9b8e6] bg-[#fbf2ff] px-2 py-0.5 text-xs font-medium text-[#8d38aa]">
              Beta
            </span>
          </div>

          <div className="mt-auto space-y-4 max-md:mt-0">
            <div className="rounded-lg bg-[#f4f3f4] px-4 py-4 text-[15px] leading-6 text-app-muted">
              I need a lead gen form for my personal training services.
            </div>

            <div className="rounded-lg bg-[#f8ecfb] p-4 text-[15px] text-app-muted">
              <p className="mb-4">Here's what we did:</p>
              <div className="flex gap-3 rounded-md bg-[#f1e3f7] px-4 py-4 text-app-text">
                <Check size={18} className="mt-0.5 shrink-0" />
                <span>Created personal training lead form.</span>
              </div>
            </div>

            <div className="flex gap-3 text-app-muted">
              <button className="text-xl leading-none">♡</button>
              <button className="rotate-180 text-xl leading-none">♡</button>
            </div>

            <div className="rounded-lg bg-[#f8ecfb] px-4 py-4 text-[15px] leading-6 text-app-muted">
              I've drafted the form. Is there anything else you want to include?
            </div>
          </div>

          <div className="mt-10 rounded-lg border border-[#b980d4] bg-white px-3 py-2 shadow-focus max-md:mt-4">
            <div className="mb-8 text-sm text-app-muted">Chat to create</div>
            <div className="flex items-center justify-between text-app-muted">
              <div className="flex items-center gap-4">
                <Mic size={18} />
                <Plus size={18} />
                <MoreHorizontal size={18} />
              </div>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-md border border-app-border bg-[#fafafa] text-[#c5bdc9]"
                aria-label="Send sample prompt"
              >
                <SendHorizontal size={17} />
              </button>
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col bg-[#f7f7f8]">
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-app-border bg-white px-5">
            <div className="flex rounded-lg border border-app-border bg-white text-sm font-semibold text-app-muted">
              <button className="rounded-l-lg bg-[#f2f1f2] px-4 py-2 text-app-text">
                Suggested changes
              </button>
              <button className="border-l border-app-border px-4 py-2">
                ▷ Preview
              </button>
            </div>
            <button className="icon-button" onClick={onClose} aria-label="Close AI sample">
              <X size={20} />
            </button>
          </div>

          <div className="relative min-h-0 flex-1 overflow-y-auto px-10 py-4 max-md:px-4">
            <div className="mx-auto max-w-[470px] bg-white shadow-[0_0_0_1px_rgba(232,229,234,0.7)]">
              {previewQuestions.map((question) => (
                <div
                  key={question.number}
                  className="border-b border-app-border px-4 py-4"
                >
                  <div className="flex gap-3">
                    <div
                      className={[
                        "flex h-7 min-w-12 items-center justify-center gap-1 rounded-md text-sm font-bold text-app-text",
                        question.color
                      ].join(" ")}
                    >
                      {"icon" in question && question.icon ? (
                        <question.icon size={15} />
                      ) : (
                        <span>{question.label}</span>
                      )}
                      <span>{question.number}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="mb-2 text-[15px] font-semibold text-app-text">
                        {question.title}
                      </p>
                      {question.choices ? (
                        <div className="space-y-1 text-[15px] text-app-muted">
                          {question.choices.map((choice, index) => (
                            <div key={choice} className="flex gap-4">
                              <span className="font-bold text-app-text">
                                {String.fromCharCode(65 + index)}
                              </span>
                              <span>{choice}</span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>

          <div className="flex h-16 shrink-0 items-center justify-end border-t border-app-border bg-white px-5">
            <Link
              href="/forms/new/builder"
              className="rounded-lg bg-app-primary px-5 py-2.5 text-sm font-normal text-white hover:bg-[var(--primary-hover)]"
            >
              Create form
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
