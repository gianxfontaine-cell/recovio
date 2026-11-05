"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export function OrganizationSetup() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  async function createOrganization(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError("")
    try {
      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug: slug || name })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Organization setup failed")
      router.refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Organization setup failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={createOrganization} className="mt-6 grid gap-4">
      <label className="grid gap-2 text-sm">
        Organization name
        <input required minLength={2} maxLength={100} value={name} onChange={event => setName(event.target.value)}
          className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2" />
      </label>
      <label className="grid gap-2 text-sm">
        Organization slug
        <input maxLength={80} value={slug} onChange={event => setSlug(event.target.value)}
          placeholder="generated-from-name" className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2" />
      </label>
      <button disabled={busy} className="rounded-xl bg-sky-400 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50">
        {busy ? "Creating…" : "Create organization"}
      </button>
      {error ? <p role="alert" className="text-sm text-red-300">{error}</p> : null}
    </form>
  )
}

export function InviteMember() {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("VIEWER")
  const [inviteUrl, setInviteUrl] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  async function invite(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError("")
    setInviteUrl("")
    try {
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Invitation could not be created")
      setInviteUrl(data.inviteUrl)
      setEmail("")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Invitation could not be created")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <form onSubmit={invite} className="grid gap-3 sm:grid-cols-[1fr_180px_auto]">
        <input required type="email" value={email} onChange={event => setEmail(event.target.value)}
          placeholder="teammate@company.com" className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm" />
        <select value={role} onChange={event => setRole(event.target.value)}
          className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm">
          <option value="FINANCE">Finance</option>
          <option value="OPERATIONS">Operations</option>
          <option value="VIEWER">Viewer</option>
          <option value="ADMIN">Admin</option>
        </select>
        <button disabled={busy} className="rounded-lg bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">
          {busy ? "Creating…" : "Create invite"}
        </button>
      </form>
      {inviteUrl ? (
        <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
          <p>Invite created. Copy and send this one-time link; it expires in 7 days.</p>
          <input readOnly value={inviteUrl} onFocus={event => event.currentTarget.select()}
            className="mt-2 w-full rounded border border-white/10 bg-slate-950 px-3 py-2 text-xs" />
        </div>
      ) : null}
      {error ? <p role="alert" className="mt-3 text-sm text-red-300">{error}</p> : null}
    </div>
  )
}

export function AcceptInvitation({ token }: { token: string }) {
  const router = useRouter()
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  async function accept() {
    setBusy(true)
    setError("")
    try {
      const response = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Invitation could not be accepted")
      router.push("/")
      router.refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Invitation could not be accepted")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <button onClick={accept} disabled={busy} className="mt-5 rounded-xl bg-sky-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50">
        {busy ? "Joining…" : "Accept invitation"}
      </button>
      {error ? <p role="alert" className="mt-3 text-sm text-red-300">{error}</p> : null}
    </div>
  )
}
