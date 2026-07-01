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
  const items = navFor(role);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const NavList = () => (
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
              active
                ? "bg-gold-100 text-ink-900 ring-1 ring-gold-300"
                : "text-ink-500 hover:bg-panel hover:text-ink-900",
            )}
          >
            <Icon size={18} className={active ? "text-gold-700" : "text-muted"} />
            {t(item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[264px_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-hair bg-surface lg:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-hair px-4">
          <KVEmblem size={36} />
          <div className="leading-tight">
            <div className="text-[13px] font-bold text-ink-900">Kendriya Vidyalaya No 1</div>
            <div className="text-[11px] text-muted">IIT Kharagpur</div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <NavList />
        </div>
        <UserCard name={name} roleLabel={roleLabel} />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink-900/30" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-surface shadow-[var(--shadow-pop)]">
            <div className="flex h-16 items-center justify-between border-b border-hair px-4">
              <div className="flex items-center gap-2.5">
                <KVEmblem size={32} />
                <span className="text-[13px] font-bold text-ink-900">Kendriya Vidyalaya No 1</span>
              </div>
              <button aria-label={t("common.close")} onClick={() => setOpen(false)} className="rounded-sm p-1.5 text-ink-500 hover:bg-panel">
                <CloseIcon size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavList />
            </div>
            <UserCard name={name} roleLabel={roleLabel} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-hair bg-paper/85 px-4 backdrop-blur sm:px-6">
          <button aria-label="Menu" onClick={() => setOpen(true)} className="rounded-sm p-1.5 text-ink-700 hover:bg-panel lg:hidden">
            <MenuIcon size={20} />
          </button>
          <div className="lg:hidden">
            <KVEmblem size={30} />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <LocaleSwitcher />
            <form action={signOut}>
              <button className="inline-flex items-center gap-1.5 rounded-sm border border-hair bg-surface px-2.5 py-1.5 text-[13px] font-medium text-ink-700 hover:bg-panel" title={t("common.signOut")}>
                <LogoutIcon size={16} className="text-muted" />
                <span className="hidden sm:inline">{t("common.signOut")}</span>
              </button>
            </form>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}

function UserCard({ name, roleLabel }: { name: string; roleLabel: string }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="flex items-center gap-3 border-t border-hair p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-900 text-[13px] font-semibold text-gold-100">
        {initials}
      </div>
      <div className="min-w-0 leading-tight">
        <div className="truncate text-[13px] font-semibold text-ink-900">{name}</div>
        <div className="truncate text-[12px] text-ink-500">{roleLabel}</div>
      </div>
    </div>
  );
}
