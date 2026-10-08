"use client";

import { useState } from "react";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { TopNav } from "@/components/top-nav";
import { mockSession } from "@/lib/session";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-app-canvas">
      <TopNav
        session={mockSession}
        onOpenSidebar={() => setSidebarOpen(true)}
      />
      <div className="flex h-[calc(100vh-114px)] min-h-[620px] max-md:h-[calc(100vh-76px)] max-md:min-h-0">
        <DashboardSidebar session={mockSession} />
        <main className="min-w-0 flex-1 overflow-auto bg-app-canvas">
          {children}
        </main>
      </div>
      {sidebarOpen ? (
        <div className="fixed inset-0 z-50 hidden bg-black/20 max-md:block">
          <div className="h-full w-[calc(100%-28px)] max-w-[320px] bg-white shadow-2xl">
            <DashboardSidebar
              session={mockSession}
              mobile
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
