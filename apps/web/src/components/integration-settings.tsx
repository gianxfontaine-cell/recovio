"use client"

import { useState } from "react"

const providers = [
  { id: "netsuite", name: "NetSuite", fields: [["accountId", "Account ID"], ["consumerKey", "Consumer key"], ["consumerSecret", "Consumer secret"], ["tokenId", "Token ID"], ["tokenSecret", "Token secret"]] },
  { id: "xpo", name: "XPO", fields: [["apiKey", "API key"]] },
  { id: "estes", name: "Estes", fields: [["apiKey", "API key"]] }
] as const

type Integration = { provider: string; status: string; lastCheckedAt: string | null; lastError: string | null }

export function IntegrationSettings({
  mode,
  initialIntegrations
}: {
  mode: string
  initialIntegrations: Integration[]
}) {
  const [integrations, setIntegrations] = useState(initialIntegrations)
  const [values, setValues] = useState<Record<string, Record<string, string>>>({})
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState("")

  async function submit(provider: string, action: "configure" | "diagnostics") {
    setBusy(`${provider}:${action}`)
    setMessage("")
    try {
      const response = await fetch(`/api/integrations/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action === "configure" ? {
          provider,
          credentials: values[provider] ?? {}
        } : { provider })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || data.integration?.lastError || "Integration request failed")
      if (data.integration) {
        setIntegrations(current => [
          ...current.filter(item => item.provider !== provider),
          data.integration
        ])
      }
      if (action === "configure") {
        setValues(current => ({ ...current, [provider]: {} }))
        setMessage(`${provider} credentials saved encrypted. Run diagnostics to verify the connection.`)
      } else {
        setMessage(`${provider} diagnostic status: ${data.integration.status}`)
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Integration request failed")
    } finally {
      setBusy("")
    }
  }

  return (
    <div className="space-y-5">
      {mode === "mock" ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          Demo mode uses fixture data only. Live credentials and network diagnostics are disabled.
        </p>
      ) : null}
      {providers.map(provider => {
        const integration = integrations.find(item => item.provider === provider.id)
        return (
          <section key={provider.id} className="rounded-xl border border-white/10 bg-slate-950/50 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">{provider.name}</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Status: {integration?.status ?? "NOT CONFIGURED"}
                  {integration?.lastCheckedAt ? ` · checked ${new Date(integration.lastCheckedAt).toLocaleString()}` : ""}
                </p>
              </div>
              {integration ? (
                <button disabled={busy !== "" || mode === "mock"} onClick={() => submit(provider.id, "diagnostics")}
                  className="rounded-lg border border-white/10 px-3 py-2 text-sm disabled:opacity-40">
                  {busy === `${provider.id}:diagnostics` ? "Checking…" : "Run diagnostics"}
                </button>
              ) : null}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {provider.fields.map(([key, label]) => (
                <label key={key} className="grid gap-1 text-xs text-slate-400">
                  {label}
                  <input type="password" autoComplete="new-password" value={values[provider.id]?.[key] ?? ""}
                    onChange={event => setValues(current => ({
                      ...current,
                      [provider.id]: { ...current[provider.id], [key]: event.target.value }
                    }))}
                    className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white"
                    disabled={mode === "mock"} />
                </label>
              ))}
            </div>
            <button disabled={busy !== "" || mode === "mock"} onClick={() => submit(provider.id, "configure")}
              className="mt-4 rounded-lg bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-40">
              {busy === `${provider.id}:configure` ? "Saving…" : "Save credentials"}
            </button>
            {integration?.lastError ? <p className="mt-3 text-xs text-amber-200">{integration.lastError}</p> : null}
          </section>
        )
      })}
      {message ? <p role="status" className="text-sm text-sky-200">{message}</p> : null}
    </div>
  )
}
