"use client";

import Link from "next/link";
import {
  ChevronDown,
  X,
  Grid2X2,
  Plus,
  Search,
  Sparkles,
  SquarePlus
} from "lucide-react";
import { AiPrompt } from "@/components/ai-prompt";
import type { CreatorSession } from "@/lib/session";
import { useState } from "react";

export function DashboardSidebar({
  session,
  mobile = false,
  onClose
}: {
  session: CreatorSession;
  mobile?: boolean;
  onClose?: () => void;
}) {
  const [privateOpen, setPrivateOpen] = useState(true);
  const progress =
    session.responseLimit === 0
      ? 0
      : (session.responsesCollected / session.responseLimit) * 100;

  return (
    <aside
      className={[
        "flex w-[270px] shrink-0 flex-col border-r border-app-border bg-app-sidebar",
        mobile ? "h-full w-full border-r-0 bg-white" : "max-md:hidden"
      ].join(" ")}
    >
      {mobile ? (
        <div className="flex h-12 items-center justify-end px-4">
          <button
            className="icon-button border border-app-border"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>
      ) : null}

      <div className={mobile ? "order-last px-6 pb-6" : "border-b border-app-border px-4 py-4"}>
        <Link
          href="/forms/new"
          onClick={onClose}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-app-primary text-[15px] font-normal text-white hover:bg-[var(--primary-hover)]"
        >
          <Plus size={18} />
          Create form
        </Link>
      </div>

      <div className="flex h-[58px] items-center gap-3 border-b border-app-border px-7 text-app-muted">
        <Search size={18} />
        <span>Search</span>
      </div>

      <div className="flex-1 px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3 text-[15px] font-bold text-app-muted">
            <Grid2X2 size={17} />
            Workspaces
          </div>
          <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-app-border bg-white text-app-muted hover:bg-[#f8f8f8]">
            <Plus size={18} />
          </button>
        </div>

        <button
          className="mb-4 flex w-full items-center justify-between px-3 text-left text-sm font-bold text-app-muted"
          onClick={() => setPrivateOpen((value) => !value)}
          aria-expanded={privateOpen}
        >
          <span>Private</span>
          <ChevronDown
            size={15}
            className={[
              "transition-transform",
              privateOpen ? "rotate-180" : ""
            ].join(" ")}
          />
        </button>
        {privateOpen ? (
          <button className="flex h-10 w-full items-center justify-between rounded-md bg-[#e9e8ea] px-3 text-left text-[15px] text-app-text">
            <span>{session.workspaceName}</span>
            <span className="text-app-muted">3</span>
          </button>
        ) : null}
      </div>

      <div className="border-y border-app-border px-5 py-6">
        <div className="mb-2 text-sm text-app-text">Responses collected</div>
        <div className="h-1 rounded-full bg-[#d8d3dc]">
          <div
            className="h-full rounded-full bg-app-primary"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 text-[15px] font-semibold text-app-muted">
          {session.responsesCollected} / {session.responseLimit}
        </div>
        <button className="mt-5 rounded-md border border-app-border bg-white px-3 py-1.5 text-sm font-semibold text-app-muted hover:bg-[#f8f8f8]">
          Increase response limit
        </button>
      </div>

      <div className="p-4">
        <AiPrompt compact />
      </div>

      <div className="hidden px-4 pb-4 text-xs text-app-muted">
        <Sparkles size={12} />
        <SquarePlus size={12} />
      </div>
    </aside>
  );
}
