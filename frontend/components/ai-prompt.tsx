import { Mic, SendHorizontal } from "lucide-react";

export function AiPrompt({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={[
        "flex items-center gap-3 rounded-xl border bg-white text-app-muted",
        "border-[#ead8f1] shadow-focus",
        compact ? "h-11 px-3" : "h-14 px-4"
      ].join(" ")}
    >
      <Mic size={17} />
      <div className="h-6 w-px bg-app-border" />
      <span className="min-w-0 flex-1 truncate">Ask Typeform AI</span>
      <button
        className="flex h-7 w-7 items-center justify-center rounded-md border border-app-border bg-[#fafafa] text-[#c5bdc9]"
        aria-label="Send AI prompt"
      >
        <SendHorizontal size={15} />
      </button>
    </div>
  );
}
