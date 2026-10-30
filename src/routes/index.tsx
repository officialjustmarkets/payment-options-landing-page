import { createFileRoute } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { MpesaFlow } from "@/components/mpesa-flow";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Funding — Deposit Methods" },
      { name: "description", content: "Choose a payment method to fund your account: cards, mobile money, crypto and more." },
      { property: "og:title", content: "Funding — Deposit Methods" },
      { property: "og:description", content: "Choose a payment method to fund your account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

type Cat = "Cards" | "Mobile" | "Crypto" | "Wallet" | "Wire Transfer" | "Payment Agent";
type Method = { name: string; cat: Cat; time: string; limits: string; icon: ReactNode; min: number; max: number; currency: string };

const Circle = ({ c, children }: { c: string; children: ReactNode }) => (
  <span className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-primary-foreground" style={{ background: c }}>{children}</span>
);

const methods: Method[] = [
  { name: "Visa / MasterCard", cat: "Cards", time: "Instant", limits: "10 USD — 10000 USD", min: 10, max: 10000, currency: "USD",
    icon: <svg width="24" height="20" viewBox="0 0 24 20" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="2" width="22" height="16" rx="2"/><path d="M1 7h22"/></svg> },
  { name: "MPESA", cat: "Mobile", time: "Instant", limits: "10 USD – 1900 USD", min: 10, max: 1900, currency: "USD",
    icon: <span className="flex h-3 w-8 items-center justify-center rounded-[2px] text-[5px] font-bold text-primary-foreground" style={{ background: "#2fb344" }}>M-PESA</span> },
  { name: "Mobile Money", cat: "Mobile", time: "Instant - 30 minutes", limits: "10 USD – 1000 USD", min: 10, max: 1000, currency: "USD",
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="4" y="2" width="11" height="20" rx="2"/><rect x="11" y="9" width="10" height="7" rx="1"/><circle cx="16" cy="12.5" r="1"/></svg> },
  { name: "Tether USD/USDT", cat: "Crypto", time: "Instant - 15 minutes", limits: "10 USD – 1000000 USD", min: 10, max: 1000000, currency: "USDT", icon: <Circle c="#26a17b">₮</Circle> },
  { name: "USD Coin / USDC", cat: "Crypto", time: "Instant - 15 minutes", limits: "10 USD – 1000000 USD", min: 10, max: 1000000, currency: "USDC", icon: <Circle c="#2775ca">$</Circle> },
  { name: "Bitcoin", cat: "Crypto", time: "Instant - 30 minutes", limits: "21 USD – 1000000 USD", min: 21, max: 1000000, currency: "BTC", icon: <Circle c="#f7931a">₿</Circle> },
  { name: "Skrill", cat: "Wallet", time: "Instant", limits: "10 USD – 10000 USD", min: 10, max: 10000, currency: "USD", icon: <Circle c="#862165">S</Circle> },
  { name: "Neteller", cat: "Wallet", time: "Instant", limits: "10 USD – 10000 USD", min: 10, max: 10000, currency: "USD", icon: <Circle c="#83ba3b">N</Circle> },
  { name: "Bank Wire Transfer", cat: "Wire Transfer", time: "1-3 business days", limits: "100 USD – 1000000 USD", min: 100, max: 1000000, currency: "USD",
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18"/></svg> },
  { name: "Local Payment Agent", cat: "Payment Agent", time: "Instant - 1 hour", limits: "10 USD – 5000 USD", min: 10, max: 5000, currency: "USD",
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg> },
];

const KES_RATE = 129;
const BONUS_MIN = 350;

const tabs = ["All methods", "Cards", "Mobile", "Crypto", "Wallet", "Wire Transfer", "Payment Agent"] as const;

function Index() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("All methods");
  const [open, setOpen] = useState<Method | null>(null);
  const list = tab === "All methods" ? methods : methods.filter((m) => m.cat === tab);

  return (
    <main className="min-h-screen bg-background px-4 py-4 font-sans text-foreground sm:px-4">
      <h1 className="text-2xl font-semibold">Funding</h1>
      <button className="mt-6 rounded bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">Deposit</button>

      <nav className="mt-9 flex max-w-[660px] overflow-x-auto border-b border-border text-sm">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`whitespace-nowrap px-5 pb-2 ${tab === t ? "border-b-2 border-foreground font-medium" : "border-b-2 border-transparent"}`}>
            {t}
          </button>
        ))}
      </nav>

      <section className="px-4">
        <h2 className="mt-5 mb-4 text-sm font-medium">{tab === "All methods" ? "All payment methods" : `${tab} payment methods`}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((m) => (
            <button key={m.name} onClick={() => setOpen(m)}
              className="rounded border border-border bg-card text-left transition-shadow hover:shadow-md">
              <div className="flex h-14 items-center gap-4 border-b border-border px-4">
                <span className="flex w-7 justify-center">{m.icon}</span>
                <span className="text-sm font-semibold">{m.name}</span>
              </div>
              <div className="space-y-1 px-3 py-4 text-[11px] text-muted-foreground">
                <p>Processing time <span className="text-foreground">{m.time}</span></p>
                <p>Fee <span className="text-foreground">0%</span></p>
                <p>Limits <span className="text-foreground">{m.limits}</span></p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {open && <DepositModal m={open} onClose={() => setOpen(null)} />}
    </main>
  );
}

function DepositModal({ m, onClose }: { m: Method; onClose: () => void }) {
  const [amount, setAmount] = useState("");
  const [extra, setExtra] = useState("");
  const [done, setDone] = useState(false);
  const [mpesaStarted, setMpesaStarted] = useState(false);
  const n = Number(amount);
  const valid = n >= m.min && n <= m.max;
  const extraLabel = m.cat === "Mobile" ? "Phone number" : m.cat === "Cards" ? "Card number" : m.cat === "Crypto" ? "Network (e.g. TRC20)" : m.cat === "Wallet" ? "Wallet email" : m.cat === "Wire Transfer" ? "Account holder name" : "Agent ID";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={m.name} className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-lg bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3"><span className="flex w-7 justify-center">{m.icon}</span><h3 className="font-semibold">{m.name}</h3></div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close payment form" className="text-xl text-muted-foreground">×</Button>
        </div>
        {mpesaStarted ? <MpesaFlow amount={n * KES_RATE} phone={extra} onClose={onClose} /> : done ? (
          <div className="py-6 text-center">
            <p className="font-semibold">Deposit request submitted</p>
            <p className="mt-2 text-sm text-muted-foreground">{n} {m.currency} via {m.name}{m.cat === "Mobile" ? ` (KSh ${(n * KES_RATE).toLocaleString()})` : ""}. {n >= BONUS_MIN ? `$${(n * 2).toLocaleString()} will be credited to your Personal Wallet.` : ""} Processing time: {m.time}.</p>
            <button onClick={onClose} className="mt-6 rounded bg-primary px-5 py-2 text-sm text-primary-foreground">Done</button>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); if (valid && extra.trim()) { if (m.name === "MPESA") setMpesaStarted(true); else setDone(true); } }} className="space-y-4 text-sm">
            <div className="grid grid-cols-3 gap-2 rounded bg-muted p-3 text-[11px] text-muted-foreground">
              <p>Processing<br /><span className="text-foreground">{m.time}</span></p>
              <p>Fee<br /><span className="text-foreground">0%</span></p>
              <p>Limits<br /><span className="text-foreground">{m.limits}</span></p>
            </div>
            <label className="block">{extraLabel}
              <input value={extra} onChange={(e) => setExtra(e.target.value)} required className="mt-1 w-full rounded border border-input px-3 py-2" />
            </label>
            <label className="block">Amount ({m.currency})
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`${m.min} – ${m.max}`} className="mt-1 w-full rounded border border-input px-3 py-2" />
            </label>
            {m.cat === "Mobile" && n > 0 && (
              <p className="rounded bg-muted px-3 py-2 text-xs">You will pay <span className="font-semibold">KSh {(n * KES_RATE).toLocaleString()}</span> <span className="text-muted-foreground">(1 USD = {KES_RATE} KSh)</span></p>
            )}
            {valid && (n >= BONUS_MIN ? (
              <p className="rounded border border-border px-3 py-2 text-xs">Cashback bonus unlocked! You'll receive <span className="font-semibold">${(n * 2).toLocaleString()}</span> in your Personal Wallet.</p>
            ) : (
              <p className="text-xs text-muted-foreground">Deposit ${BONUS_MIN} or more to double it — e.g. $350 becomes $700 in your Personal Wallet.</p>
            ))}
            {amount && !valid && <p className="text-xs text-destructive">Amount must be between {m.min} and {m.max}.</p>}
            <Button type="submit" disabled={!valid || !extra.trim()} className="w-full">Continue</Button>
          </form>
        )}
      </div>
    </div>
  );
}
