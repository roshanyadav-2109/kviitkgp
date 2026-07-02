"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon, CloseIcon, LogoutIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { navFor, type NavRole } from "@/lib/nav";
import { useT } from "@/i18n/provider";
import { KVEmblem } from "@/components/brand";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { signOut } from "@/lib/actions";

export function AppShell({
  name,
  role,
  roleLabel,
  children,
}: {
  name: string;
  role: NavRole;
  roleLabel: string;
  children: React.ReactNode;
}) {
  const t = useT();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const items = navFor(role);

  // Students get a dark, floating KV rail; other roles keep the light sidebar.
  const dark = role === "student";

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const navList = (
    <nav className="flex flex-col gap-0.5 p-3">
      {items.map((item) => {
        const active = isActive(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href + item.labelKey}
            href={item.href}
            onClick={() => setOpen(false)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-sm px-3 py-2 text-[14px] font-medium transition-colors",
              dark
                ? active
                  ? "bg-gold-500 text-ink-900"
                  : "text-gold-100/80 hover:bg-white/10 hover:text-gold-100"
                : active
                  ? "bg-gold-100 text-ink-900 ring-1 ring-gold-300"
                  : "text-ink-500 hover:bg-panel hover:text-ink-900",
            )}
          >
            <Icon
              size={18}
              className={cn(
                active
                  ? dark ? "text-ink-900" : "text-gold-700"
                  : dark ? "text-gold-500" : "text-muted",
              )}
            />
            {t(item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );

  const brandHeader = (
    <div className={cn("flex h-16 items-center gap-2.5 px-4", dark ? "" : "border-b border-hair")}>
      <KVEmblem size={36} />
      <div className="leading-tight">
        <div className={cn("text-[13px] font-bold", dark ? "text-gold-100" : "text-ink-900")}>Kendriya Vidyalaya No 1</div>
        <div className={cn("text-[11px]", dark ? "text-gold-100/50" : "text-muted")}>IIT Kharagpur</div>
      </div>
    </div>
  );

  // Dark rail footer: vendor wordmark ("hebrew" over "technologies"). "hebrew"
  // sets the width; "technologies" spreads its letters to fill that exact width.
  const brandFooter = (
    <div className="px-4 py-4 text-center">
      <div className="inline-block">
        <div className="text-[22px] font-normal lowercase leading-none text-gold-100">hebrew</div>
        <div className="mt-1.5 flex justify-between text-[12px] font-normal lowercase leading-none text-gold-100/55" aria-hidden>
          {"technologies".split("").map((ch, i) => (
            <span key={i}>{ch}</span>
          ))}
        </div>
        <span className="sr-only">technologies</span>
      </div>
    </div>
  );

  return (
    <div className={cn("min-h-dvh lg:grid lg:grid-cols-[264px_1fr]", dark && "bg-paper")}>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "sticky hidden flex-col lg:flex",
          dark
            ? "top-3 m-3 h-[calc(100dvh-1.5rem)] overflow-hidden rounded-md bg-gradient-to-b from-ink-900 to-ink-700 ring-1 ring-ink-900/60"
            : "top-0 h-dvh border-r border-hair bg-surface",
        )}
      >
        {brandHeader}
        <div className="flex-1 overflow-y-auto">
          {navList}
        </div>
        {dark ? brandFooter : <UserCard name={name} roleLabel={roleLabel} dark={dark} />}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink-900/30" onClick={() => setOpen(false)} />
          <aside
            className={cn(
              "absolute left-0 top-0 flex h-full w-72 flex-col shadow-[var(--shadow-pop)]",
              dark ? "bg-gradient-to-b from-ink-900 to-ink-700" : "bg-surface",
            )}
          >
            <div className={cn("flex h-16 items-center justify-between px-4", dark ? "border-b border-white/10" : "border-b border-hair")}>
              <div className="flex items-center gap-2.5">
                <KVEmblem size={32} />
                <span className={cn("text-[13px] font-bold", dark ? "text-gold-100" : "text-ink-900")}>Kendriya Vidyalaya No 1</span>
              </div>
              <button
                aria-label={t("common.close")}
                onClick={() => setOpen(false)}
                className={cn("rounded-sm p-1.5", dark ? "text-gold-100/70 hover:bg-white/10" : "text-ink-500 hover:bg-panel")}
              >
                <CloseIcon size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {navList}
            </div>
            {dark ? brandFooter : <UserCard name={name} roleLabel={roleLabel} dark={dark} />}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        {/* Top bar */}
        <header className={cn("sticky top-0 z-30 flex h-16 items-center gap-3 bg-paper/85 px-4 backdrop-blur sm:px-6", dark ? "lg:hidden" : "border-b border-hair")}>
          <button aria-label="Menu" onClick={() => setOpen(true)} className="rounded-sm p-1.5 text-ink-700 hover:bg-panel lg:hidden">
            <MenuIcon size={20} />
          </button>
          <div className="lg:hidden">
            <KVEmblem size={30} />
          </div>
          {/* Students carry identity in the dashboard profile card; staff use this menu. */}
          {!dark && (
            <div className="relative ml-auto">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-panel"
              >
                <span className="text-right leading-tight">
                  <span className="block text-[13px] font-semibold text-ink-900">{name}</span>
                  <span className="block text-[12px] text-ink-500">{roleLabel}</span>
                </span>
                <span className="flex items-center gap-0.5 pl-0.5 text-ink-500" aria-hidden>
                  <span className="h-1 w-1 rounded-full bg-current" />
                  <span className="h-1 w-1 rounded-full bg-current" />
                  <span className="h-1 w-1 rounded-full bg-current" />
                </span>
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                  <div role="menu" className="absolute right-0 top-full z-40 mt-1.5 w-52 rounded-lg border border-hair bg-surface p-1.5 shadow-[var(--shadow-pop)]">
                    <div className="px-1.5 pb-1.5">
                      <LocaleSwitcher />
                    </div>
                    <div className="my-1 border-t border-hair" />
                    <form action={signOut}>
                      <button className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[13px] font-medium text-ink-700 hover:bg-panel">
                        <LogoutIcon size={16} className="text-muted" />
                        {t("common.signOut")}
                      </button>
                    </form>
                  </div>
                </>
              )}
            </div>
          )}
        </header>

        {/* Every tab's content sits in one common block beside the sidebar. */}
        <main className={cn("w-full flex-1", dark ? "p-3 lg:py-3 lg:pl-0 lg:pr-3" : "mx-auto max-w-6xl px-4 py-6 sm:px-6")}>
          {dark ? (
            <div className="rounded-md bg-surface p-4 lg:min-h-[calc(100dvh-1.5rem)] lg:p-6">{children}</div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}

function UserCard({ name, roleLabel, dark }: { name: string; roleLabel: string; dark?: boolean }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className={cn("flex items-center gap-3 p-4", dark ? "border-t border-white/10" : "border-t border-hair")}>
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold",
          dark ? "bg-gold-500 text-ink-900" : "bg-ink-900 text-gold-100",
        )}
      >
        {initials}
      </div>
      <div className="min-w-0 leading-tight">
        <div className={cn("truncate text-[13px] font-semibold", dark ? "text-gold-100" : "text-ink-900")}>{name}</div>
        <div className={cn("truncate text-[12px]", dark ? "text-gold-100/60" : "text-ink-500")}>{roleLabel}</div>
      </div>
    </div>
  );
}
