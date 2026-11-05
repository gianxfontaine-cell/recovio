import { requireTenantUser, recordAuditEvent } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { buildDisputeLetterHtml } from "@recovio/core";

export async function POST(req: Request) {
  const access = await requireTenantUser(["ADMIN", "FINANCE"]);
  if (!access.ok) return access.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || !("deductionId" in body) ||
      typeof body.deductionId !== "string" || !body.deductionId.trim()) {
    return Response.json({ error: "deductionId required" }, { status: 400 });
  }

  const deduction = await prisma.deduction.findFirst({
    where: { id: body.deductionId, tenantId: access.user.tenantId },
    include: { retailer: true, shipment: true }
  });

  if (!deduction) {
    return Response.json({ error: "Deduction not found" }, { status: 404 });
  }
  if (deduction.status !== "READY_TO_DISPUTE") {
    return Response.json({ error: "Only deductions ready to dispute can be submitted for review" }, { status: 422 });
  }
  if (!deduction.amount.isNegative()) {
    return Response.json({ error: "Only a negative retailer deduction can be disputed" }, { status: 422 });
  }

  const existing = await prisma.dispute.findUnique({ where: { deductionId: deduction.id } });
  if (existing && existing.status !== "REJECTED") {
    return Response.json({ error: `Dispute is already ${existing.status.toLowerCase().replace(/_/g, " ")}` }, { status: 409 });
  }

  const letterHtml = buildDisputeLetterHtml({
    retailerName: deduction.retailer.name,
    externalId: deduction.externalId,
    amount: deduction.amount.toFixed(2),
    reasonDescription: deduction.reasonDescription ?? deduction.reasonCode,
    invoiceNumber: deduction.invoiceNumber,
    poNumber: deduction.poNumber,
    proNumber: deduction.shipment?.proNumber ?? null,
    bolNumber: deduction.shipment?.bolNumber ?? null,
    carrierName: deduction.shipment?.carrierName ?? null,
    podSigned: deduction.shipment?.podSigned ?? false,
    faultParty: deduction.faultParty
  });

  const dispute = existing
    ? await prisma.dispute.update({
        where: { id: existing.id },
        data: {
          letterHtml,
          requestedAmount: deduction.amount.abs(),
          requestedById: access.user.id,
          status: "PENDING_REVIEW",
          reviewedById: null,
          reviewedAt: null,
          reviewNotes: null
        }
      })
    : await prisma.dispute.create({
        data: {
          tenantId: access.user.tenantId,
          deductionId: deduction.id,
          requestedById: access.user.id,
          status: "PENDING_REVIEW",
          requestedAmount: deduction.amount.abs(),
          letterHtml
        }
      });

  await recordAuditEvent({
    tenantId: access.user.tenantId,
    actorId: access.user.id,
    action: "dispute.submitted_for_review",
    resourceType: "dispute",
    resourceId: dispute.id,
    metadata: { deductionId: deduction.id, amount: dispute.requestedAmount.toFixed(2) }
  });

  return Response.json({
    ok: true,
    disputeId: dispute.id,
    status: dispute.status,
    letterHtml
  });
}
