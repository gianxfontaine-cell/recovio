import { requireTenantUser, recordAuditEvent } from "@/lib/access"
import { canReviewDispute, tenantScope } from "@/lib/access-policy"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const access = await requireTenantUser(["ADMIN", "FINANCE"])
  if (!access.ok) return access.response

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "Request body must be valid JSON" }, { status: 400 })
  }
  if (!body || typeof body !== "object" || !("decision" in body) ||
      (body.decision !== "APPROVE" && body.decision !== "REJECT") ||
      !("notes" in body) || typeof body.notes !== "string" || body.notes.trim().length < 8) {
    return Response.json({ error: "Provide an approval or rejection decision and review notes (at least 8 characters)" }, { status: 400 })
  }

  const dispute = await prisma.dispute.findFirst({
    where: tenantScope(access.user.tenantId, { id: params.id }),
    select: { id: true, status: true, requestedById: true }
  })
  if (!dispute) return Response.json({ error: "Dispute not found" }, { status: 404 })
  if (!canReviewDispute(dispute.status, dispute.requestedById, access.user.id)) {
    if (dispute.status !== "PENDING_REVIEW") {
      return Response.json({ error: "Only disputes pending review can be decided" }, { status: 409 })
    }
    return Response.json({ error: "Disputes must be reviewed by a different organization member" }, { status: 403 })
  }

  const status = body.decision === "APPROVE" ? "APPROVED" : "REJECTED"
  const result = await prisma.dispute.updateMany({
    where: tenantScope(access.user.tenantId, { id: dispute.id, status: "PENDING_REVIEW" }),
    data: {
      status,
      reviewedById: access.user.id,
      reviewedAt: new Date(),
      reviewNotes: body.notes.trim()
    }
  })
  if (result.count !== 1) {
    return Response.json({ error: "Dispute status changed before review completed" }, { status: 409 })
  }

  await recordAuditEvent({
    tenantId: access.user.tenantId,
    actorId: access.user.id,
    action: `dispute.${status.toLowerCase()}`,
    resourceType: "dispute",
    resourceId: dispute.id,
    metadata: { notes: body.notes.trim() }
  })
  return Response.json({ ok: true, status })
}
