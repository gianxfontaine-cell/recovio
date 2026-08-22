"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SyncButton() {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function run() {
    setState("loading");
    setMessage("");
    try {
      const res = await fetch("/api/integrations/netsuite/sync", {
        method: "POST"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");
      setMessage("Synced " + data.synced + " invoices (" + data.mode + " mode)");
      setState("done");
      router.refresh();
    } catch (error: any) {
      setMessage(error.message);
      setState("error");
    }
  }

  return (
    <div className="mt-4">
      <button
        onClick={run}
        disabled={state === "loading"}
        className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
          state === "loading"
            ? "cursor-wait bg-slate-700 text-slate-400"
            : "bg-blue-500 text-blue-950 hover:bg-blue-400"
        }`}
      >
        {state === "loading" ? "Syncing…" : "Sync from NetSuite"}
      </button>

      {message ? (
        <p
          className={`mt-3 text-xs ${
            state === "error" ? "text-red-300" : "text-emerald-300"
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
