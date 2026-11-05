import { requireTenantUser, recordAuditEvent } from "@/lib/access"
import { decryptCredentials } from "@/lib/credentials"
import { prisma } from "@/lib/prisma"
import { isDemoMode } from "@/lib/mode"
import { NetSuiteClient } from "@recovio/integrations"
import { getCarrierAdapter } from "@recovio/integrations"

export async function POST(req: Request) {
  const access = await requireTenantUser(["ADMIN", "OPERATIONS"])
  if (!access.ok) return access.response

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "Request body must be valid JSON" }, { status: 400 })
  }
  if (!body || typeof body !== "object" || !("provider" in body) || typeof body.provider !== "string") {
    return Response.json({ error: "Provider is required" }, { status: 400 })
  }
  const provider = body.provider
  if (!["netsuite", "xpo", "estes"].includes(provider)) {
    return Response.json({ error: "Unsupported integration provider" }, { status: 400 })
  }
  if (isDemoMode()) {
    return Response.json({ error: "Live connection diagnostics are disabled in demo mode" }, { status: 409 })
  }

  const saved = await prisma.integrationCredential.findUnique({
    where: { tenantId_provider: { tenantId: access.user.tenantId, provider } }
  })
  if (!saved) return Response.json({ error: "Configure credentials before running diagnostics" }, { status: 409 })
  const credentials = decryptCredentials(
    saved.encryptedCredentials,
    `${access.user.tenantId}:${provider}`
  )
  let status = "CONNECTED"
  let lastError: string | null = null

  try {
    if (provider === "netsuite") {
      const client = new NetSuiteClient({
        accountId: credentials.accountId,
        consumerKey: credentials.consumerKey,
        consumerSecret: credentials.consumerSecret,
        tokenId: credentials.tokenId,
        tokenSecret: credentials.tokenSecret
      })
      await client.queryInvoices()
    } else {
      const carrierName = provider === "xpo" ? "XPO Logistics" : "Estes Express"
      const shipment = await prisma.shipment.findFirst({
        where: {
          tenantId: access.user.tenantId,
          carrierName: { contains: provider === "xpo" ? "XPO" : "Estes", mode: "insensitive" },
          proNumber: { not: null }
        },
        select: { carrierName: true, proNumber: true }
      })
      if (!shipment?.proNumber) {
        status = "CONFIGURED"
        lastError = "Credentials saved; sync a shipment before testing carrier access."
      } else {
        const adapter = getCarrierAdapter(
          shipment.carrierName ?? carrierName,
          false,
          credentials.apiKey
        )
        if (!adapter) throw new Error("No adapter is registered for this carrier")
        const probe = await adapter.fetchPod(shipment.proNumber)
        if (!probe.success && /API error/i.test(probe.exceptionNotes ?? "")) {
          status = "ERROR"
          lastError = probe.exceptionNotes ?? "Carrier did not return a successful POD response"
        }
      }
    }
  } catch (error) {
    status = "ERROR"
    lastError = error instanceof Error ? error.message.slice(0, 500) : "Connection diagnostic failed"
  }

  const updated = await prisma.integrationCredential.update({
    where: { id: saved.id },
    data: { status, lastCheckedAt: new Date(), lastError },
    select: { provider: true, status: true, lastCheckedAt: true, lastError: true }
  })
  await recordAuditEvent({
    tenantId: access.user.tenantId,
    actorId: access.user.id,
    action: "integration.diagnostic_run",
    resourceType: "integration",
    resourceId: provider,
    metadata: { status }
  })
  return Response.json({ ok: status === "CONNECTED", integration: updated }, {
    status: status === "ERROR" ? 502 : 200
  })
}
