"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export function DisputeReview({
  disputeId,
  canReview
}: {
  disputeId: string
  canReview: boolean
}) {
  const router = useRouter()
  const [notes, setNotes] = useState("")
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)

  async function decide(decision: "APPROVE" | "REJECT") {
    setBusy(true)
    setMessage("")
    try {
      const response = await fetch(`/api/disputes/${disputeId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, notes })
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Review could not be saved")
      setMessage(`Dispute ${decision.toLowerCase()}d.`)
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Review could not be saved")
    } finally {
      setBusy(false)
    }
  }

  if (!canReview) {
    return <p className="mt-4 text-sm text-amber-200">A different organization member with Finance or Admin access must review this dispute.</p>
  }
  return (
    <div className="mt-4 border-t border-white/10 pt-4">
      <label className="grid gap-2 text-sm text-slate-300">
        Review notes (required)
        <textarea value={notes} onChange={event => setNotes(event.target.value)} minLength={8} required
          className="min-h-20 rounded-lg border border-white/10 bg-slate-950 px-3 py-2" />
      </label>
      <div className="mt-3 flex gap-3">
        <button disabled={busy || notes.trim().length < 8} onClick={() => decide("APPROVE")}
          className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-40">
          Approve
        </button>
        <button disabled={busy || notes.trim().length < 8} onClick={() => decide("REJECT")}
          className="rounded-lg border border-red-500/40 px-4 py-2 text-sm text-red-200 disabled:opacity-40">
          Reject
        </button>
      </div>
      {message ? <p role="status" className="mt-3 text-sm text-sky-200">{message}</p> : null}
    </div>
  )
}
