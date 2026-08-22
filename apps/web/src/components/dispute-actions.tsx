"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function DisputeActions({
  deductionId,
  externalId,
  canDispute,
  existingLetter
}: {
  deductionId: string;
  externalId: string;
  canDispute: boolean;
  existingLetter: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [letter, setLetter] = useState<string | null>(existingLetter);
  const [message, setMessage] = useState("");

  async function generate() {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/disputes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deductionId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setLetter(data.letterHtml);
      downloadFile("Recovio-Dispute-" + externalId + ".html", data.letterHtml);
      setMessage("Dispute package generated, downloaded, and saved to this tenant.");
      router.refresh();
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {letter ? (
        <button
          onClick={() => downloadFile("Recovio-Dispute-" + externalId + ".html", letter)}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold hover:bg-white/10"
        >
          Download Dispute Letter
        </button>
      ) : (
        <button
          onClick={generate}
          disabled={!canDispute || busy}
          className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
            canDispute && !busy
              ? "bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
              : "cursor-not-allowed bg-slate-700 text-slate-400"
          }`}
        >
          {busy ? "Generating…" : "Generate Dispute Package"}
        </button>
      )}

      {!canDispute && !letter ? (
        <p className="text-xs text-slate-500">
          Only deductions marked READY TO DISPUTE can generate packages.
          Resolve missing evidence first.
        </p>
      ) : null}

      {letter ? (
        <p className="text-xs text-emerald-300">
          A Dispute record is saved for this deduction. Open the file and
          print to PDF to file it with the retailer.
        </p>
      ) : null}

      {message ? (
        <p className="text-xs text-emerald-300">{message}</p>
      ) : null}
    </div>
  );
}
