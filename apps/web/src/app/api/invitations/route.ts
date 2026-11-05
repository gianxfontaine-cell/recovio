import { randomBytes, createHash } from "node:crypto"
import { requireTenantUser, recordAuditEvent } from "@/lib/access"
import { prisma } from "@/lib/prisma"

const inviteRoles = ["ADMIN", "FINANCE", "OPERATIONS", "VIEWER"]

export async function POST(req: Request) {
  const access = await requireTenantUser(["ADMIN"])
  if (!access.ok) return access.response

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "Request body must be valid JSON" }, { status: 400 })
  }
  if (!body || typeof body !== "object" || !("email" in body) || typeof body.email !== "string") {
    return Response.json({ error: "A valid email is required" }, { status: 400 })
  }

  const email = body.email.trim().toLowerCase()
  const role = "role" in body && typeof body.role === "string" ? body.role : "VIEWER"
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Provide a valid email address" }, { status: 400 })
  }
  if (!inviteRoles.includes(role)) {
    return Response.json({ error: "Invalid organization role" }, { status: 400 })
  }
  const existingUser = await prisma.user.findUnique({ where: { email }, select: { tenantId: true } })
  if (existingUser?.tenantId) {
    return Response.json({ error: "This user already belongs to an organization" }, { status: 409 })
  }

  const token = randomBytes(32).toString("base64url")
  const invitation = await prisma.invitation.create({
    data: {
      tenantId: access.user.tenantId,
      email,
      role,
      tokenHash: createHash("sha256").update(token).digest("hex"),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdById: access.user.id
    }
  })
  await recordAuditEvent({
    tenantId: access.user.tenantId,
    actorId: access.user.id,
    action: "invitation.created",
    resourceType: "invitation",
    resourceId: invitation.id,
    metadata: { email, role }
  })

  const appUrl = process.env.AUTH_URL ?? new URL(req.url).origin
  const url = new URL(`/invite/${token}`, appUrl).toString()
  return Response.json({ ok: true, inviteUrl: url, expiresAt: invitation.expiresAt }, { status: 201 })
}
