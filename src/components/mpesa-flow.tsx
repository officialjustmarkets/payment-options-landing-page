import { useEffect, useState } from "react";
import { AlertCircle, LoaderCircle, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

export const MPESA_STK_TIMEOUT_MS = 10_000;
export const MPESA_PAYBILL = "775093";
export const MPESA_ACCOUNT = "142810011";

export function MpesaFlow({ amount, phone, onClose }: { amount: number; phone: string; onClose: () => void }) {
  const [stage, setStage] = useState<"stk" | "paybill" | "verification">("stk");

  useEffect(() => {
    if (stage !== "stk") return;
    const timeout = setTimeout(() => setStage("paybill"), MPESA_STK_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [stage]);

  const spinner = <LoaderCircle aria-hidden="true" className="mx-auto mb-4 h-8 w-8 text-primary motion-safe:animate-spin" />;

  return (
    <div className="space-y-5 text-sm">
      <p className="border-b border-border pb-3 text-xs text-muted-foreground">Demo payment · No phone prompt or live verification is connected.</p>
      <div aria-live="polite" aria-atomic="true">
        {stage === "stk" ? (
          <div className="py-5 text-center" role="status">
            {spinner}
            <h4 className="font-semibold">STK push pending</h4>
            <p className="mt-2 break-words text-muted-foreground">Request for KSh {amount.toLocaleString()} to {phone}.</p>
          </div>
        ) : stage === "paybill" ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
              <div><h4 className="font-semibold">STK push failed</h4><p className="mt-1 text-muted-foreground">The request timed out. Use M-PESA Paybill instead.</p></div>
            </div>
            <dl className="divide-y divide-border border-y border-border">
              <div className="flex justify-between gap-4 py-3"><dt className="text-muted-foreground">Paybill number</dt><dd className="font-semibold" data-testid="mpesa-paybill">{MPESA_PAYBILL}</dd></div>
              <div className="flex justify-between gap-4 py-3"><dt className="text-muted-foreground">Account number</dt><dd className="font-semibold" data-testid="mpesa-account">{MPESA_ACCOUNT}</dd></div>
              <div className="flex justify-between gap-4 py-3"><dt className="text-muted-foreground">Amount</dt><dd className="font-semibold">KSh {amount.toLocaleString()}</dd></div>
            </dl>
            <p className="text-muted-foreground">In M-PESA, select Lipa na M-PESA, then Pay Bill, and enter these details. Never share your PIN here.</p>
            <Button className="w-full" onClick={() => setStage("verification")}><Smartphone aria-hidden="true" />I have paid</Button>
          </div>
        ) : (
          <div className="py-5 text-center" role="status">
            {spinner}
            <h4 className="font-semibold">Awaiting payment verification</h4>
            <p className="mt-2 text-muted-foreground">KSh {amount.toLocaleString()} · Account {MPESA_ACCOUNT}</p>
            <p className="mt-3 text-xs text-muted-foreground">Demo only: payment cannot be confirmed and no wallet credit will be applied.</p>
          </div>
        )}
      </div>
      <Button variant="outline" className="w-full" onClick={onClose}>Close</Button>
    </div>
  );
}