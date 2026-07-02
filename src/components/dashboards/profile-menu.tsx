"use client";
import { useState } from "react";
import { LogoutIcon } from "@/components/icons";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { signOut } from "@/lib/actions";

// Vertical three-dot menu shown beside the student's name in the profile card.
export function ProfileMenu({ signOutLabel }: { signOutLabel: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex flex-col items-center gap-[3px] rounded-md p-2 text-ink-500 hover:bg-panel"
      >
        <span className="h-[3px] w-[3px] rounded-full bg-current" />
        <span className="h-[3px] w-[3px] rounded-full bg-current" />
        <span className="h-[3px] w-[3px] rounded-full bg-current" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div role="menu" className="absolute right-0 top-full z-40 mt-1.5 w-48 rounded-lg border border-hair bg-surface p-1.5 shadow-[var(--shadow-pop)]">
            <div className="px-1.5 pb-1.5">
              <LocaleSwitcher />
            </div>
            <div className="my-1 border-t border-hair" />
            <form action={signOut}>
              <button className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[13px] font-normal text-ink-700 hover:bg-panel">
                <LogoutIcon size={16} className="text-muted" />
                {signOutLabel}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
