import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildDisputeLetterHtml } from "@recovio/core";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { tenant: true }
  });

  if (!user?.tenant) {
    return Response.json({ error: "No tenant" }, { status: 403 });
  }

  const body = await req.json();
  const deductionId = body?.deductionId;
  if (!deductionId) {
    return Response.json({ error: "deductionId required" }, { status: 400 });
  }

  const deduction = await prisma.deduction.findFirst({
    where: { id: deductionId, tenantId: user.tenant.id },
    include: { retailer: true, shipment: true }
  });

  if (!deduction) {
    return Response.json({ error: "Deduction not found" }, { status: 404 });
  }

  const letterHtml = buildDisputeLetterHtml({
    retailerName: deduction.retailer.name,
    externalId: deduction.externalId,
    amount: deduction.amount,
    reasonDescription: deduction.reasonDescription ?? deduction.reasonCode,
    invoiceNumber: deduction.invoiceNumber,
    poNumber: deduction.poNumber,
    proNumber: deduction.shipment?.proNumber ?? null,
    bolNumber: deduction.shipment?.bolNumber ?? null,
    carrierName: deduction.shipment?.carrierName ?? null,
    podSigned: deduction.shipment?.podSigned ?? false,
    faultParty: deduction.faultParty
  });

  const dispute = await prisma.dispute.upsert({
    where: { deductionId: deduction.id },
    update: {
      letterHtml,
      requestedAmount: Math.abs(deduction.amount)
    },
    create: {
      tenantId: user.tenant.id,
      deductionId: deduction.id,
      status: "GENERATED",
      requestedAmount: Math.abs(deduction.amount),
      letterHtml
    }
  });

  return Response.json({
    ok: true,
    disputeId: dispute.id,
    letterHtml
  });
}
