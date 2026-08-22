"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CarrierSync() {
  const router = useRouter();
  const [busy, setBusy] = useState<null | "shipments" | "pods">(null);
  const [message, setMessage] = useState("");

  async function call(url: string, kind: "shipments" | "pods") {
    setBusy(kind);
    setMessage("");
    try {
      const res = await fetch(url, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setMessage(data.message);
      router.refresh();
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-4 space-y-2">
      <button
        onClick={() => call("/api/integrations/carriers/shipments", "shipments")}
        disabled={busy !== null}
        className="w-full rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-semibold text-violet-950 transition-colors hover:bg-violet-400 disabled:cursor-wait disabled:bg-slate-700 disabled:text-slate-400"
      >
        {busy === "shipments" ? "Syncing…" : "Sync Shipments from 3PL"}
      </button>

      <button
        onClick={() => call("/api/integrations/carriers/pods", "pods")}
        disabled={busy !== null}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-white/10 disabled:cursor-wait disabled:bg-slate-700 disabled:text-slate-400"
      >
        {busy === "pods" ? "Fetching…" : "Fetch PODs from Carriers"}
      </button>

      {message ? (
        <p className="text-xs text-emerald-300">{message}</p>
      ) : null}
    </div>
  );
}
