"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function EdiSync() {
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
      <button
        onClick={run}
        disabled={busy}
        className="w-full rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-rose-950 transition-colors hover:bg-rose-400 disabled:cursor-wait disabled:bg-slate-700 disabled:text-slate-400"
      >
        {busy ? "Ingesting…" : "Simulate EDI 820 Deduction Feed"}
      </button>

      {message ? (
        <p className="mt-3 text-xs text-emerald-300">{message}</p>
      ) : null}
    </div>
  );
}
