"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Provider } from "@supabase/supabase-js";
import { ArrowRightIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/i18n/provider";
import { KVEmblem } from "@/components/brand";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/demo";

// ── Provider brand marks (inline so they need no external assets) ──────────────
function GoogleMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
}
function MicrosoftMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <rect x="1" y="1" width="10" height="10" fill="#F25022" />
      <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
      <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
      <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
    </svg>
  );
}
// Zoho's brandmark is its four-colour wordmark.
function ZohoMark() {
  const letters: [string, string][] = [["Z", "#E42527"], ["o", "#F9B21D"], ["h", "#089949"], ["o", "#226DB4"]];
  return (
    <span className="text-[13px] font-bold leading-none tracking-tight" aria-hidden>
      {letters.map(([ch, c], i) => (<span key={i} style={{ color: c }}>{ch}</span>))}
    </span>
  );
}

const PROVIDERS: { key: string; provider: Provider; label: string; Mark: (p: { size?: number }) => React.ReactElement }[] = [
  { key: "google", provider: "google", label: "Continue with Google", Mark: GoogleMark },
  { key: "microsoft", provider: "azure", label: "Continue with Microsoft", Mark: MicrosoftMark },
  { key: "zoho", provider: "zoho" as Provider, label: "Continue with Zoho", Mark: ZohoMark },
];

export default function LoginPage() {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState(false);

  async function signIn(em: string, pw: string, key: string) {
    setBusy(key); setError(false);
    const { error } = await supabase.auth.signInWithPassword({ email: em, password: pw });
    if (error) { setError(true); setBusy(null); return; }
    router.push(params.get("next") || "/");
    router.refresh();
  }

  async function oauth(provider: Provider, key: string) {
    setBusy(key); setError(false);
    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}${params.get("next") || "/"}` : undefined;
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
    if (error) { setError(true); setBusy(null); }
  }

  const rowBase = "flex w-full items-center gap-3 rounded-sm border border-hair bg-surface px-4 py-2.5 text-[14px] font-normal text-ink-900 transition-colors hover:bg-panel disabled:opacity-50";

  return (
    <div className="grid min-h-dvh lg:h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* ── Left: image frame ────────────────────────────────────────────────── */}
      <aside className="hidden p-3 lg:block">
        <div className="h-full w-full overflow-hidden rounded-md border border-hair bg-ink-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/kv-login.webp" alt="Kendriya Vidyalaya No 1, IIT Kharagpur" className="h-full w-full object-cover" />
        </div>
      </aside>

      {/* ── Right: welcome + sign-in options ─────────────────────────────────── */}
      <main className="flex flex-col justify-center overflow-y-auto px-6 py-8 sm:px-14">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-hair bg-surface p-1">
                <KVEmblem size={34} />
              </span>
              <div className="text-[15px] font-semibold leading-snug text-ink-900">Kendriya Vidyalaya No 1, IIT Kharagpur</div>
            </div>
            <h1 className="font-display mt-3 text-center text-[42px] font-medium leading-[1.02] tracking-[-0.02em] text-ink-900">Welcomes</h1>
          </div>

          {error && (
            <p className="mb-3 rounded-sm border border-down/30 bg-down-soft px-3 py-2 text-[13px] text-down">{t("auth.invalid")}</p>
          )}

          {/* Provider sign-in */}
          <div className="space-y-2">
            {PROVIDERS.map(({ key, provider, label, Mark }) => (
              <button key={key} onClick={() => oauth(provider, key)} disabled={busy !== null} className={rowBase}>
                <span className="flex w-7 shrink-0 justify-center"><Mark size={20} /></span>
                <span className="flex-1 text-left font-semibold">{label}</span>
                {busy === key && <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-hair border-t-ink-900" />}
              </button>
            ))}
          </div>

          {/* Demo logins, listed the same way */}
          <div className="my-4 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
            <span className="h-px flex-1 bg-hair" />
            {t("auth.demoTitle")}
            <span className="h-px flex-1 bg-hair" />
          </div>

          <div className="space-y-2">
            {DEMO_ACCOUNTS.map((a) => (
              <button key={a.email} onClick={() => signIn(a.email, DEMO_PASSWORD, a.email)} disabled={busy !== null}
                className={`${rowBase} group justify-between`}>
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-panel text-[12px] font-semibold text-ink-900">
                    {t(`roles.${a.role}`).charAt(0)}
                  </span>
                  <span className="truncate text-[14px] font-normal text-ink-900">{t(`roles.${a.role}`)}</span>
                </span>
                {busy === a.email ? (
                  <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-hair border-t-ink-900" />
                ) : (
                  <ArrowRightIcon size={16} className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-ink-900" />
                )}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
