import { requireTenantUser, recordAuditEvent } from "@/lib/access"
import { ensureDraftBackCharge } from "@/lib/back-charge"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function POST(req: Request) {
  const access = await requireTenantUser(["ADMIN", "FINANCE"])
  if (!access.ok) return access.response

  let deductionId: string | undefined
  try {
    const body = await req.json()
    if (body !== null && typeof body === "object" && "deductionId" in body) {
      if (typeof body.deductionId !== "string" || !body.deductionId.trim()) {
        return Response.json({ error: "deductionId must be a non-empty string" }, { status: 400 })
      }
      deductionId = body.deductionId
    }
  } catch {
    return Response.json({ error: "Request body must be valid JSON" }, { status: 400 })
  }

  const deductions = await prisma.deduction.findMany({
    where: {
      tenantId: access.user.tenantId,
      faultParty: "THREE_PL",
      amount: { lt: 0 },
      ...(deductionId ? { id: deductionId } : {})
    },
    include: {
      retailer: { select: { name: true } },
      shipment: {
        select: {
          thirdPartyLogistics: true,
          proNumber: true,
          bolNumber: true,
          carrierName: true
        }
      }
    },
    orderBy: { deductionDate: "asc" }
  })

  if (deductionId && deductions.length === 0) {
    const exists = await prisma.deduction.findFirst({
      where: { id: deductionId, tenantId: access.user.tenantId },
      select: { id: true }
    })
    return Response.json(
      { error: exists ? "Deduction is not eligible for a 3PL back-charge" : "Deduction not found" },
      { status: exists ? 422 : 404 }
    )
  }

  let created = 0
  let refreshed = 0
  let skipped = 0

  for (const deduction of deductions) {
    const result = await ensureDraftBackCharge(prisma, {
      tenantId: access.user.tenantId,
      workspaceName: access.user.tenant.name,
      deduction
    })
    if (result.created) {
      created++
    } else if (result.refreshed) {
      refreshed++
    } else {
      skipped++
    }
  }

  await recordAuditEvent({
    tenantId: access.user.tenantId,
    actorId: access.user.id,
    action: "back_charge.drafts_generated",
    resourceType: "back_charge",
    metadata: { created, refreshed, skipped }
  })
  return Response.json({ ok: true, created, refreshed, skipped })
}
