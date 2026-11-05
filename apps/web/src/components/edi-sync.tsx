"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function EdiSync({ demoMode }: { demoMode: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function run() {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/integrations/edi/deductions", {
        method: "POST"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setMessage(data.message);
      router.refresh();
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4">
      {!demoMode ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
          EDI fixture ingestion is disabled in production. Configure your existing EDI adapter before syncing customer data.
        </p>
      ) : null}
      <button
        onClick={run}
        disabled={busy || !demoMode}
        className="w-full rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-rose-950 transition-colors hover:bg-rose-400 disabled:cursor-wait disabled:bg-slate-700 disabled:text-slate-400"
      >
        {busy ? "Ingesting…" : demoMode ? "Simulate EDI 820 Deduction Feed" : "Demo ingestion disabled"}
      </button>

      {message ? (
        <p className="mt-3 text-xs text-emerald-300">{message}</p>
      ) : null}
    </div>
  );
}
