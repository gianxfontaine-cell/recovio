"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export function GenerateBackCharges({
  deductionId
}: {
  deductionId?: string
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function generate() {
    setBusy(true)
    setMessage(null)
    try {
      const response = await fetch("/api/back-charges/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deductionId ? { deductionId } : {})
      })
      const result: {
        error?: string
        created?: number
        refreshed?: number
        skipped?: number
      } = await response.json()
      if (!response.ok) {
        throw new Error(result.error ?? "Could not generate debit memos")
      }
      setMessage(
        `${result.created ?? 0} created, ${result.refreshed ?? 0} draft(s) updated, ${result.skipped ?? 0} skipped`
      )
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not generate debit memos")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={generate}
        disabled={busy}
        className="rounded-xl bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-200 disabled:cursor-wait disabled:opacity-60"
      >
        {busy ? "Generating…" : deductionId ? "Generate debit memo" : "Generate eligible memos"}
      </button>
      {message ? (
        <p role="status" className="mt-2 text-xs text-slate-400">
          {message}
        </p>
      ) : null}
    </div>
  )
}
