import { requireTenantUser, recordAuditEvent } from "@/lib/access"
import { encryptCredentials } from "@/lib/credentials"
import { prisma } from "@/lib/prisma"
import { isDemoMode } from "@/lib/mode"

const requiredFields: Record<string, string[]> = {
  netsuite: ["accountId", "consumerKey", "consumerSecret", "tokenId", "tokenSecret"],
  xpo: ["apiKey"],
  estes: ["apiKey"]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

export async function POST(req: Request) {
  const access = await requireTenantUser(["ADMIN"])
  if (!access.ok) return access.response

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "Request body must be valid JSON" }, { status: 400 })
  }
  if (!isRecord(body)) {
    return Response.json({ error: "Provider and credentials are required" }, { status: 400 })
  }
  const provider = body.provider
  const credentialValues = body.credentials
  if (typeof provider !== "string" || !isRecord(credentialValues)) {
    return Response.json({ error: "Provider and credentials are required" }, { status: 400 })
  }

  const required = requiredFields[provider]
  if (!required) return Response.json({ error: "Unsupported integration provider" }, { status: 400 })
  const credentials = Object.fromEntries(
    required.map(key => [key, credentialValues[key]])
      .filter((entry): entry is [string, string] => typeof entry[1] === "string")
  )
  if (required.some(key => !credentials[key]?.trim())) {
    return Response.json({ error: "All provider credential fields are required" }, { status: 400 })
  }
  if (provider === "netsuite" && !/^[A-Za-z0-9_-]+$/.test(credentials.accountId)) {
    return Response.json({ error: "NetSuite account ID contains invalid characters" }, { status: 400 })
  }
  if (isDemoMode()) {
    return Response.json({ error: "Live credentials cannot be enabled while demo mode is active" }, { status: 409 })
  }

  const encryptedCredentials = encryptCredentials(
    credentials,
    `${access.user.tenantId}:${provider}`
  )
  const configured = await prisma.integrationCredential.upsert({
    where: {
      tenantId_provider: { tenantId: access.user.tenantId, provider }
    },
    update: { encryptedCredentials, status: "CONFIGURED", lastCheckedAt: null, lastError: null },
    create: {
      tenantId: access.user.tenantId,
      provider,
      encryptedCredentials
    },
    select: { provider: true, status: true, updatedAt: true }
  })
  await recordAuditEvent({
    tenantId: access.user.tenantId,
    actorId: access.user.id,
    action: "integration.credentials_updated",
    resourceType: "integration",
    resourceId: provider
  })
  return Response.json({ ok: true, integration: configured }, { status: 201 })
}
