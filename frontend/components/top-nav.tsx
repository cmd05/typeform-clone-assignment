"use client";

import {
  BarChart3,
  BriefcaseBusiness,
  ChevronDown,
  CircleHelp,
  FileText,
  Gem,
  GitBranch,
  Grid2X2,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Search,
  UsersRound
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { UserAvatar } from "@/components/avatar";
import type { CreatorSession } from "@/lib/session";
import { useState } from "react";

const navItems = [
  { label: "Forms", icon: FileText, active: true },
  { label: "Contacts", icon: UsersRound },
  { label: "Automations", icon: GitBranch },
  { label: "Insights", icon: BarChart3 },
  { label: "Pages", icon: LayoutDashboard, beta: true }
];

export function TopNav({
  session,
  onOpenSidebar
}: {
  session: CreatorSession;
  onOpenSidebar: () => void;
}) {
  const [accountOpen, setAccountOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <header className="h-[114px] border-b border-app-border bg-white max-md:h-[76px]">
      <div className="flex h-14 items-center justify-between px-4 max-md:h-10 max-md:px-2">
        <div className="flex items-center gap-3">
          <BrandMark />
          <button
            className="relative flex items-center gap-1 text-[15px] font-semibold text-app-muted max-md:w-7 max-md:justify-center"
            onClick={() => setAccountOpen((value) => !value)}
            aria-expanded={accountOpen}
          >
            <span className="max-md:hidden">{session.accountLabel}</span>
            <ChevronDown
              size={16}
              className={[
                "transition-transform",
                accountOpen ? "rotate-180" : ""
              ].join(" ")}
            />
          </button>
          {accountOpen ? (
            <div className="absolute left-12 top-12 z-30 w-64 rounded-xl border border-app-border bg-white p-2 shadow-lg max-md:left-2 max-md:top-10">
              <div className="rounded-lg px-3 py-2 text-sm font-semibold text-app-text">
                {session.accountLabel}
              </div>
              <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-app-muted hover:bg-[#f6f5f6]">
                Account settings
              </button>
              <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-app-muted hover:bg-[#f6f5f6]">
                Switch workspace
              </button>
            </div>
          ) : null}
          <button
            className="hidden icon-button max-md:flex"
            onClick={onOpenSidebar}
            aria-label="Open sidebar"
          >
            <Menu size={18} />
          </button>
          <span className="sr-only">
            {session.accountLabel}
          </span>
        </div>

        <div className="flex items-center gap-5 text-sm font-semibold text-app-muted max-md:gap-3">
          <button className="flex items-center gap-2 hover:text-app-text">
            <Grid2X2 size={18} />
            <span className="max-lg:hidden">Integrations</span>
          </button>
          <button className="flex items-center gap-2 hover:text-app-text">
            <BriefcaseBusiness size={18} />
            <span className="max-lg:hidden">Brand kit</span>
          </button>
          <button className="rounded-lg bg-app-teal px-5 py-2 font-normal text-white hover:bg-[#0b6e63] max-md:px-4 max-md:py-1.5 max-md:text-xs">
            View plans
          </button>
          <button className="icon-button" aria-label="Help">
            <CircleHelp size={19} />
          </button>
          <UserAvatar initial={session.userInitial} />
        </div>
      </div>

      <nav className="flex h-[60px] items-stretch border-t border-[#f4f2f5] px-3 max-md:h-9 max-md:px-1">
        <div className="flex min-w-0 items-stretch gap-2 max-md:flex-1">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={[
                "relative flex items-center gap-2 rounded-t-lg px-5 text-[15px] font-semibold text-app-muted max-md:px-3 max-md:text-sm",
                item.label !== "Forms" ? "max-md:hidden" : "",
                item.active ? "bg-[#f6f5f6] text-app-text" : "hover:bg-[#f8f8f8]"
              ].join(" ")}
            >
              <item.icon size={18} />
              {item.label}
              {item.label === "Insights" ? (
                <span className="ml-1 flex h-6 w-6 items-center justify-center rounded-full border border-[#8ed6cb] bg-[#e8fbf8] text-app-teal">
                  <Gem size={14} />
                </span>
              ) : null}
              {item.beta ? (
                <span className="rounded-md border border-[#9fcff1] bg-[#eef8ff] px-2 py-0.5 text-xs font-medium text-[#2575aa]">
                  Beta
                </span>
              ) : null}
              {item.active ? (
                <span className="absolute bottom-0 left-5 right-5 h-[3px] rounded-full bg-app-primary" />
              ) : null}
            </button>
          ))}
        </div>
        <div className="mx-7 my-4 w-px bg-app-border max-md:mx-2 max-md:my-2" />
        <button className="flex items-center gap-2 px-2 text-[15px] font-semibold text-app-muted hover:text-app-text max-md:text-sm">
          <Search size={18} />
          Research Flow
        </button>
        <div className="relative ml-auto hidden max-md:block">
          <button
            className="icon-button"
            onClick={() => setMoreOpen((value) => !value)}
            aria-label="More navigation"
            aria-expanded={moreOpen}
          >
            <MoreHorizontal size={18} />
          </button>
          {moreOpen ? (
            <div className="absolute right-0 top-9 z-30 w-48 rounded-xl border border-app-border bg-white p-2 shadow-lg">
              {navItems.slice(1).map((item) => (
                <button
                  key={item.label}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-app-muted hover:bg-[#f6f5f6]"
                >
                  <item.icon size={16} />
                  {item.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
