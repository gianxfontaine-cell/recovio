import { createHash } from "node:crypto"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "Request body must be valid JSON" }, { status: 400 })
  }
  if (!body || typeof body !== "object" || !("token" in body) || typeof body.token !== "string") {
    return Response.json({ error: "Invitation token is required" }, { status: 400 })
  }

  const email = session.user.email.toLowerCase()
  const tokenHash = createHash("sha256").update(body.token).digest("hex")
  const invitation = await prisma.invitation.findUnique({ where: { tokenHash } })
  if (!invitation || invitation.email !== email || invitation.acceptedAt || invitation.expiresAt <= new Date()) {
    return Response.json({ error: "Invitation is invalid, expired, or for another email address" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, tenantId: true } })
  if (!user) return Response.json({ error: "User account not found" }, { status: 401 })
  if (user.tenantId) return Response.json({ error: "User already belongs to an organization" }, { status: 409 })

  const accepted = await prisma.$transaction(async tx => {
    const claimed = await tx.invitation.updateMany({
      where: { id: invitation.id, acceptedAt: null, expiresAt: { gt: new Date() } },
      data: { acceptedAt: new Date() }
    })
    if (claimed.count !== 1) throw new Error("Invitation has already been accepted")
    const joined = await tx.user.updateMany({
      where: { id: user.id, tenantId: null },
      data: { tenantId: invitation.tenantId, role: invitation.role }
    })
    if (joined.count !== 1) throw new Error("User organization membership changed")
    await tx.auditEvent.create({
      data: {
        tenantId: invitation.tenantId,
        actorId: user.id,
        action: "invitation.accepted",
        resourceType: "invitation",
        resourceId: invitation.id
      }
    })
    return tx.tenant.findUniqueOrThrow({
      where: { id: invitation.tenantId },
      select: { id: true, name: true, slug: true }
    })
  })

  return Response.json({ ok: true, organization: accepted })
}
