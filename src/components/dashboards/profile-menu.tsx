"use client";
import { useState } from "react";
import { signOut } from "@/lib/actions";
import { StudentAvatar } from "@/components/dashboards/avatar";
import type { Gender } from "@/lib/session";

// Vertical three-dot button beside the student's name. Opens a rectangular
// (~60% of screen) logout-confirmation modal showing the student's avatar.
export function ProfileMenu({
  name,
  gender,
  promptLabel,
  confirmLabel,
  cancelLabel,
}: {
  name: string;
  gender: Gender | null;
  promptLabel: string;
  confirmLabel: string;
  cancelLabel: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Menu"
        className="flex shrink-0 flex-col items-center gap-[3px] rounded-md p-2 text-ink-500 hover:bg-surface"
      >
        <span className="h-[3px] w-[3px] rounded-full bg-current" />
        <span className="h-[3px] w-[3px] rounded-full bg-current" />
        <span className="h-[3px] w-[3px] rounded-full bg-current" />
      </button>

      {open && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink-900/40" onClick={() => setOpen(false)} />
          <div className="relative z-10 flex h-[70vh] w-[92vw] flex-col items-center justify-center rounded-sm bg-surface p-8 text-center shadow-[var(--shadow-pop)] sm:h-[60vh] sm:w-[60vw]">
            <StudentAvatar name={name} gender={gender} size={96} />
            <div className="mt-4 text-[16px] font-medium text-ink-900">{name}</div>
            <p className="mt-5 t-h3 text-ink-900">{promptLabel}</p>
            <div className="mt-7 flex gap-3">
              <form action={signOut}>
                <button className="rounded-sm bg-ink-900 px-5 py-2.5 text-[13px] font-normal text-gold-100 transition-colors hover:bg-ink-700">
                  {confirmLabel}
                </button>
              </form>
              <button
                onClick={() => setOpen(false)}
                className="rounded-sm border border-hair bg-surface px-5 py-2.5 text-[13px] font-normal text-ink-700 transition-colors hover:bg-panel"
              >
                {cancelLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
