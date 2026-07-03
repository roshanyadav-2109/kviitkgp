"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoginIcon, ArrowRightIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/i18n/provider";
import { KVEmblem } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/demo";
import { LocaleSwitcher } from "@/components/locale-switcher";

// Fine tileable grain, for atmospheric depth on the dark dawn panel.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

// A rising-sun sunburst — rays + horizon arcs, echoing the KV emblem.
function RisingSun({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMax slice" className={className} fill="none" stroke="currentColor">
      {Array.from({ length: 21 }, (_, i) => {
        const a = (-90 + i * 9) * (Math.PI / 180);
        return <line key={i} x1="200" y1="200" x2={200 + Math.sin(a) * 280} y2={200 - Math.cos(a) * 280} strokeWidth="1.4" strokeOpacity="0.13" />;
      })}
      {[72, 122, 176].map((r, i) => (
        <circle key={r} cx="200" cy="200" r={r} strokeWidth="1.4" strokeOpacity={0.3 - i * 0.08} />
      ))}
      <circle cx="200" cy="200" r="46" strokeWidth="2" strokeOpacity="0.5" />
    </svg>
  );
}

export default function LoginPage() {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState(false);

  async function signIn(em: string, pw: string, key: string) {
    setBusy(key);
    setError(false);
    const { error } = await supabase.auth.signInWithPassword({ email: em, password: pw });
    if (error) {
      setError(true);
      setBusy(null);
      return;
    }
    router.push(params.get("next") || "/");
    router.refresh();
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.08fr_1fr]">
      {/* ── Brand / dawn panel ─────────────────────────────────────────────── */}
      <aside className="relative hidden overflow-hidden bg-ink-900 text-gold-100 lg:flex lg:flex-col">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {/* rising-sun glow */}
          <div
            className="absolute bottom-[-38%] left-1/2 h-[92%] w-[135%] -translate-x-1/2 rounded-[50%] blur-2xl"
            style={{ background: "radial-gradient(ellipse at center, rgba(224,158,62,0.40), rgba(224,158,62,0.10) 42%, transparent 70%)" }}
          />
          <RisingSun className="absolute bottom-0 left-1/2 h-[72%] w-[150%] -translate-x-1/2 text-gold-500" />
          {/* top-to-bottom depth + grain */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(43,27,28,0.72), transparent 26%, transparent 66%, rgba(43,27,28,0.55))" }} />
          <div className="absolute inset-0 opacity-[0.05] mix-blend-soft-light" style={{ backgroundImage: GRAIN }} />
        </div>

        <div className="relative z-10 flex h-full flex-col justify-between p-12 xl:p-16">
          <div className="reveal flex items-center gap-3" style={{ animationDelay: "60ms" }}>
            <span className="flex h-12 w-12 items-center justify-center rounded-md bg-gold-100 p-1">
              <KVEmblem size={40} />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-100/65">Kendriya Vidyalaya Sangathan</span>
          </div>

          <div className="max-w-xl">
            <div className="reveal text-[12px] font-semibold uppercase tracking-[0.28em] text-gold-300" style={{ animationDelay: "140ms" }}>
              PM Shri · IIT Kharagpur
            </div>
            <h1 className="reveal font-display mt-4 text-[48px] font-medium leading-[0.98] tracking-[-0.02em] text-gold-100 xl:text-[60px]" style={{ animationDelay: "210ms" }}>
              Kendriya Vidyalaya No.&nbsp;1
            </h1>
            <p className="reveal mt-5 text-[16px] font-medium text-gold-100/85" style={{ animationDelay: "270ms" }}>
              {t("common.appTagline")}
            </p>
            <p className="reveal mt-3 max-w-md text-[14px] leading-relaxed text-gold-100/65" style={{ animationDelay: "330ms" }}>
              {t("x.authBlurb")}
            </p>
          </div>

          <div className="reveal text-[11px] uppercase tracking-[0.18em] text-gold-100/45" style={{ animationDelay: "400ms" }}>
            {t("x.authClasses")}
          </div>
        </div>
      </aside>

      {/* ── Form panel ─────────────────────────────────────────────────────── */}
      <main className="relative flex flex-col justify-center overflow-hidden bg-paper px-6 py-12 sm:px-14">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(224,158,62,0.14), transparent 70%)" }}
        />
        <div className="relative mx-auto w-full max-w-sm">
          {/* Mobile brand + locale */}
          <div className="mb-10 flex items-center justify-between lg:hidden">
            <div className="flex items-center gap-2.5">
              <KVEmblem size={34} />
              <span className="text-[13px] font-bold text-ink-900">KV No. 1 · IIT Kharagpur</span>
            </div>
            <LocaleSwitcher />
          </div>
          <div className="mb-6 hidden justify-end lg:flex">
            <LocaleSwitcher />
          </div>

          <div className="reveal" style={{ animationDelay: "80ms" }}>
            <h2 className="font-display text-[34px] font-medium leading-tight tracking-[-0.01em] text-ink-900">{t("auth.welcome")}</h2>
            <p className="mt-1.5 text-[14px] text-ink-500">{t("auth.subtitle")}</p>
          </div>

          <form
            className="reveal mt-7 space-y-4"
            style={{ animationDelay: "160ms" }}
            onSubmit={(e) => {
              e.preventDefault();
              signIn(email, password, "form");
            }}
          >
            <Field label={t("auth.email")} htmlFor="email">
              <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@kv.demo" />
            </Field>
            <Field label={t("auth.password")} htmlFor="password">
              <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </Field>
            {error && (
              <p className="rounded-sm border border-down/30 bg-down-soft px-3 py-2 text-[13px] text-down">{t("auth.invalid")}</p>
            )}
            <Button type="submit" className="w-full" disabled={busy !== null}>
              <LoginIcon size={16} />
              {busy === "form" ? t("auth.signingIn") : t("auth.signIn")}
            </Button>
          </form>

          {/* Divider */}
          <div className="reveal my-8 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted" style={{ animationDelay: "240ms" }}>
            <span className="h-px flex-1 bg-hair" />
            {t("auth.demoTitle")}
            <span className="h-px flex-1 bg-hair" />
          </div>

          <div className="reveal grid gap-2" style={{ animationDelay: "300ms" }}>
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.email}
                onClick={() => signIn(a.email, DEMO_PASSWORD, a.email)}
                disabled={busy !== null}
                className="group flex items-center justify-between rounded-md border border-hair bg-surface px-3.5 py-2.5 text-left transition-all hover:border-gold-500 hover:bg-gold-100 disabled:opacity-50"
              >
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold text-ink-900">{t(`roles.${a.role}`)}</span>
                  <span className="block truncate text-[12px] text-ink-500">{a.note}</span>
                </span>
                {busy === a.email ? (
                  <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-gold-300 border-t-gold-700" />
                ) : (
                  <ArrowRightIcon size={16} className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-gold-700" />
                )}
              </button>
            ))}
          </div>
          <p className="mt-3 text-center text-[12px] text-muted">{t("auth.demoHint")}</p>
        </div>
      </main>
    </div>
  );
}
