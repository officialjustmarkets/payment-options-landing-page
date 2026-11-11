import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Funding Operations" },
      { name: "description", content: "Operations dashboard for funding activity, method popularity and transaction states." },
      { property: "og:title", content: "Admin — Funding Operations" },
      { property: "og:description", content: "Operations dashboard for funding activity and transaction states." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type AuditEvent = {
  id: string; created_at: string; session_id: string; event_type: string; method: string | null; tab: string | null;
  reference_id: string | null; state: string | null; value_usd: number | null; value_local: number | null; points: number | null;
};

function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    return () => data.subscription.unsubscribe();
  }, []);
  if (!ready) return <main className="p-8 text-sm text-muted-foreground">Loading…</main>;
  return session ? <AdminGate session={session} /> : <SignIn />;
}

function SignIn() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg("");
    const { data, error } = mode === "in"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/admin` } });
    if (error) setMsg(error.message);
    else if (mode === "up" && !data.session) setMsg("Check your email to confirm your account, then sign in.");
  };
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4 font-sans">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-lg border border-border bg-card p-6">
        <h1 className="text-xl font-semibold">Admin {mode === "in" ? "sign in" : "sign up"}</h1>
        <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input type="password" placeholder="Password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
        {msg && <p className="text-xs text-muted-foreground">{msg}</p>}
        <Button type="submit" className="w-full">{mode === "in" ? "Sign in" : "Create account"}</Button>
        <button type="button" className="w-full text-xs text-muted-foreground underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>
          {mode === "in" ? "Need an account? Sign up" : "Have an account? Sign in"}
        </button>
      </form>
    </main>
  );
}

function AdminGate({ session }: { session: Session }) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  useEffect(() => {
    supabase.rpc("has_role", { _user_id: session.user.id, _role: "admin" }).then(({ data }) => setIsAdmin(!!data));
  }, [session.user.id]);
  if (isAdmin === null) return <main className="p-8 text-sm text-muted-foreground">Checking access…</main>;
  if (!isAdmin) return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-4 text-center font-sans">
      <h1 className="text-xl font-semibold">No admin access</h1>
      <p className="text-sm text-muted-foreground">{session.user.email} is signed in but has not been given the admin role.</p>
      <Button variant="outline" onClick={() => supabase.auth.signOut()}>Sign out</Button>
    </main>
  );
  return <Dashboard email={session.user.email ?? ""} />;
}

const stateVariant = (s: string | null) =>
  s === "completed" ? "default" : s === "cancelled" ? "destructive" : s === "pending_verification" ? "secondary" : "outline";

function Dashboard({ email }: { email: string }) {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [error, setError] = useState("");
  const [view, setView] = useState<"overview" | "audit">("overview");
  const [method, setMethod] = useState("all");
  const [state, setState] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = async () => {
    const { data, error } = await supabase.from("audit_events").select("*").order("created_at", { ascending: false }).limit(1000);
    if (error) setError(error.message); else setEvents((data ?? []) as AuditEvent[]);
  };
  useEffect(() => { load(); }, []);

  const tx = events.filter((e) => e.event_type === "transaction");
  const stats = useMemo(() => {
    const latest = new Map<string, AuditEvent>();
    [...tx].reverse().forEach((e) => e.reference_id && latest.set(e.reference_id, e));
    const opens = new Map<string, number>();
    events.filter((e) => e.event_type === "method_open" && e.method).forEach((e) => opens.set(e.method!, (opens.get(e.method!) ?? 0) + 1));
    const initiated = tx.filter((e) => e.state === "initiated");
    return {
      visitors: new Set(events.map((e) => e.session_id)).size,
      clicks: events.filter((e) => e.event_type !== "transaction").length,
      requests: initiated.length,
      volume: initiated.reduce((s, e) => s + Number(e.value_usd ?? 0), 0),
      points: initiated.reduce((s, e) => s + Number(e.points ?? 0), 0),
      pending: [...latest.values()].filter((e) => e.state === "pending_verification").length,
      top: [...opens.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6),
    };
  }, [events]);

  const methods = [...new Set(tx.map((e) => e.method).filter(Boolean))] as string[];
  const filtered = tx.filter((e) =>
    (method === "all" || e.method === method) && (state === "all" || e.state === state) &&
    (!from || e.created_at >= new Date(from).toISOString()) &&
    (!to || e.created_at <= new Date(`${to}T23:59:59Z`).toISOString()));

  return (
    <main className="min-h-screen bg-background p-4 font-sans text-foreground sm:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-semibold">Operations</h1><p className="text-xs text-muted-foreground">{email}</p></div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}>Refresh</Button>
          <Button variant="outline" size="sm" asChild><Link to="/">Funding page</Link></Button>
          <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()}>Sign out</Button>
        </div>
      </header>
      <nav className="mt-6 flex border-b border-border text-sm">
        {(["overview", "audit"] as const).map((v) => (
          <button key={v} onClick={() => setView(v)} className={`px-5 pb-2 border-b-2 ${view === v ? "border-foreground font-medium" : "border-transparent"}`}>
            {v === "overview" ? "Overview" : "Audit trail"}
          </button>
        ))}
      </nav>
      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
      {view === "overview" ? (
        <section className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[["Unique visitors", stats.visitors], ["Clicks (tabs & methods)", stats.clicks], ["Deposit requests", stats.requests],
              ["Requested volume (USD)", `$${stats.volume.toLocaleString()}`], ["Points redeemed (requested)", stats.points.toLocaleString()],
              ["Awaiting verification", stats.pending]].map(([label, value]) => (
              <div key={label as string} className="rounded border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p>
              </div>
            ))}
          </div>
          <div className="rounded border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Most opened methods</h2>
            {stats.top.length === 0 ? <p className="mt-2 text-xs text-muted-foreground">No activity yet.</p> : (
              <ul className="mt-3 space-y-2 text-sm">
                {stats.top.map(([m, c]) => (
                  <li key={m} className="flex items-center gap-3"><span className="w-40 truncate">{m}</span>
                    <span className="h-2 rounded bg-primary" style={{ width: `${(c / stats.top[0][1]) * 60}%` }} /><span className="text-xs text-muted-foreground">{c}</span></li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : (
        <section className="mt-6 space-y-4">
          <div className="flex flex-wrap gap-3 text-sm">
            <select value={method} onChange={(e) => setMethod(e.target.value)} className="rounded border border-input bg-background px-3 py-2">
              <option value="all">All methods</option>{methods.map((m) => <option key={m}>{m}</option>)}
            </select>
            <select value={state} onChange={(e) => setState(e.target.value)} className="rounded border border-input bg-background px-3 py-2">
              <option value="all">All states</option>
              {["initiated", "pending_verification", "completed", "cancelled"].map((s) => <option key={s}>{s}</option>)}
            </select>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-auto" aria-label="From date" />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-auto" aria-label="To date" />
          </div>
          <div className="overflow-x-auto rounded border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-xs text-muted-foreground"><tr>
                {["Time (UTC)", "Reference", "Method", "USD", "KSh", "Points", "State"].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}
              </tr></thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} className="border-t border-border">
                    <td className="whitespace-nowrap px-3 py-2">{e.created_at.replace("T", " ").slice(0, 19)}</td>
                    <td className="px-3 py-2 font-mono text-xs">{e.reference_id}</td>
                    <td className="px-3 py-2">{e.method}</td>
                    <td className="px-3 py-2">{e.value_usd != null ? `$${Number(e.value_usd).toLocaleString()}` : "—"}</td>
                    <td className="px-3 py-2">{e.value_local != null ? Number(e.value_local).toLocaleString() : "—"}</td>
                    <td className="px-3 py-2">{e.points != null ? Number(e.points).toLocaleString() : "—"}</td>
                    <td className="px-3 py-2"><Badge variant={stateVariant(e.state)}>{e.state}</Badge></td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">No matching records.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
