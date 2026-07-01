"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GradCapIcon, LoginIcon, ArrowRightIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/i18n/provider";
import { KVEmblem } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/demo";
import { LocaleSwitcher } from "@/components/locale-switcher";

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
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <aside className="relative hidden flex-col justify-between bg-ink-900 p-10 text-gold-100 lg:flex">
        <div className="flex items-center gap-3">
          <KVEmblem size={44} />
          <div className="leading-tight">
            <div className="text-[15px] font-bold">Kendriya Vidyalaya</div>
            <div className="text-[12px] text-gold-300">IIT Kharagpur</div>
          </div>
        </div>
        <div className="max-w-md">
          <h1 className="t-display text-gold-100">{t("common.appTagline")}</h1>
          <p className="mt-4 text-[15px] leading-relaxed text-gold-100/75">
            One continuous record for every child — trends, not just marks. Attendance,
            reports and analytics, each scoped to what a teacher is allotted.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-gold-100/50">
          <GradCapIcon size={16} />
          Classes I–XII · Foundational to Senior · CBSE / NEP aligned
        </div>
        {/* warm gold sunrise accent, no generic gradient/swoosh */}
        <div className="pointer-events-none absolute -right-24 top-1/3 h-64 w-64 rounded-full bg-gold-500/15 blur-3xl" />
      </aside>

      {/* Form panel */}
      <main className="flex flex-col justify-center px-6 py-10 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <div className="flex items-center gap-2.5">
              <KVEmblem size={36} />
              <span className="text-[14px] font-bold text-ink-900">KV IIT Kharagpur</span>
            </div>
            <LocaleSwitcher />
          </div>

          <div className="hidden justify-end lg:flex">
            <LocaleSwitcher />
          </div>

          <h2 className="t-h1 mt-2 text-ink-900">{t("auth.welcome")}</h2>
          <p className="mt-1 text-[14px] text-ink-500">{t("auth.subtitle")}</p>

          <form
            className="mt-6 space-y-4"
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
              <p className="rounded-sm border border-down/30 bg-down-soft px-3 py-2 text-[13px] text-down">
                {t("auth.invalid")}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={busy !== null}>
              <LoginIcon size={16} />
              {busy === "form" ? t("auth.signingIn") : t("auth.signIn")}
            </Button>
          </form>

          {/* Demo logins */}
          <div className="mt-8">
            <div className="t-label">{t("auth.demoTitle")}</div>
            <p className="mb-3 mt-1 text-[12px] text-muted">{t("auth.demoHint")}</p>
            <div className="grid gap-1.5">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.email}
                  onClick={() => signIn(a.email, DEMO_PASSWORD, a.email)}
                  disabled={busy !== null}
                  className="group flex items-center justify-between rounded-sm border border-hair bg-surface px-3 py-2 text-left transition-colors hover:border-gold-500 hover:bg-gold-100 disabled:opacity-50"
                >
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-ink-900">
                      {t(`roles.${a.role}`)}
                    </span>
                    <span className="block truncate text-[12px] text-ink-500">{a.note}</span>
                  </span>
                  <ArrowRightIcon size={16} className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-gold-700" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
