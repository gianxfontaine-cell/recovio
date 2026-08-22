import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { evaluateDeduction } from "@recovio/core";

interface MockDeduction {
  externalId: string;
  retailerCode: string;
  retailerName: string;
  disputeWindowDays: number;
  invoiceNumber: string;
  proNumber: string;
  reasonCode: string;
  reasonDescription: string;
  amount: number;
  deductionDate: string;
  carrierArrivalTime?: string;
  appointmentTime?: string;
  asnSentTime?: string;
  asnDeadline?: string;
}

// Simulates a retailer EDI 820 remittance advice with chargebacks.
const MOCK_820: MockDeduction[] = [
  {
    externalId: "CB-99210",
    retailerCode: "WMT",
    retailerName: "Walmart",
    disputeWindowDays: 15,
    invoiceNumber: "INV-10042",
    proNumber: "PRO-884721-XPO",
    reasonCode: "SHORTAGE",
    reasonDescription: "Shortage claim",
    amount: -1850,
    deductionDate: "2026-08-10"
  },
  {
    externalId: "CB-99412",
    retailerCode: "WMT",
    retailerName: "Walmart",
    disputeWindowDays: 15,
    invoiceNumber: "INV-10048",
    proNumber: "PRO-440733-XPO",
    reasonCode: "OTIF_LATE",
    reasonDescription: "Late delivery / OTIF",
    amount: -4200,
    deductionDate: "2026-08-11",
    carrierArrivalTime: "2026-08-08T14:30:00Z",
    appointmentTime: "2026-08-08T16:00:00Z"
  },
  {
    externalId: "DB-44102",
    retailerCode: "TGT",
    retailerName: "Target",
    disputeWindowDays: 21,
    invoiceNumber: "INV-10043",
    proNumber: "PRO-773822-EST",
    reasonCode: "SHORTAGE",
    reasonDescription: "Shortage claim",
    amount: -1850,
    deductionDate: "2026-08-12"
  },
  {
    externalId: "DB-44288",
    retailerCode: "TGT",
    retailerName: "Target",
    disputeWindowDays: 21,
    invoiceNumber: "INV-10044",
    proNumber: "PRO-662911-XPO",
    reasonCode: "LATE_ASN",
    reasonDescription: "Late ASN transmission",
    amount: -3100,
    deductionDate: "2026-08-12",
    asnSentTime: "2026-08-03T18:40:00Z",
    asnDeadline: "2026-08-03T17:00:00Z"
  },
  {
    externalId: "CR-88321",
    retailerCode: "UNFI",
    retailerName: "UNFI",
    disputeWindowDays: 30,
    invoiceNumber: "INV-10045",
    proNumber: "PRO-551822-EST",
    reasonCode: "PRICING",
    reasonDescription: "Price discrepancy",
    amount: -620,
    deductionDate: "2026-08-13"
  }
];

export async function POST() {
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

  const tenantId = user.tenant.id;
  let processed = 0;
  let ready = 0;
  let missing = 0;

  for (const entry of MOCK_820) {
    const retailer = await prisma.retailer.upsert({
      where: {
        tenantId_code: { tenantId, code: entry.retailerCode }
      },
      update: {},
      create: {
        tenantId,
        name: entry.retailerName,
        code: entry.retailerCode,
        disputeWindowDays: entry.disputeWindowDays
      }
    });

    const invoice = await prisma.invoice.findFirst({
      where: { tenantId, invoiceNumber: entry.invoiceNumber }
    });

    const shipment = await prisma.shipment.findFirst({
      where: { tenantId, proNumber: entry.proNumber }
    });

    const evaluation = evaluateDeduction({
      reasonCode: entry.reasonCode,
      hasInvoice: Boolean(invoice),
      hasShipment: Boolean(shipment),
      podSigned: shipment?.podSigned ?? false,
      podException: false,
      carrierArrivalTime: entry.carrierArrivalTime
        ? new Date(entry.carrierArrivalTime)
        : shipment?.deliveryDate ?? undefined,
      appointmentTime: entry.appointmentTime
        ? new Date(entry.appointmentTime)
        : shipment?.appointmentTime ?? undefined,
      asnSentTime: entry.asnSentTime ? new Date(entry.asnSentTime) : undefined,
      asnDeadline: entry.asnDeadline ? new Date(entry.asnDeadline) : undefined
    });

    const deductionDate = new Date(entry.deductionDate);
    const deadlineDate = new Date(deductionDate);
    deadlineDate.setDate(deadlineDate.getDate() + retailer.disputeWindowDays);

    await prisma.deduction.upsert({
      where: {
        tenantId_retailerId_externalId: {
          tenantId,
          retailerId: retailer.id,
          externalId: entry.externalId
        }
      },
      update: {
        status: evaluation.status,
        faultParty: evaluation.faultParty,
        evidenceScore: evaluation.evidenceScore,
        shipmentId: shipment?.id ?? null
      },
      create: {
        tenantId,
        retailerId: retailer.id,
        externalId: entry.externalId,
        amount: entry.amount,
        reasonCode: entry.reasonCode,
        reasonDescription: entry.reasonDescription,
        status: evaluation.status,
        faultParty: evaluation.faultParty,
        evidenceScore: evaluation.evidenceScore,
        deductionDate,
        deadlineDate,
        invoiceNumber: entry.invoiceNumber,
        poNumber: invoice?.poNumber ?? null,
        shipmentId: shipment?.id ?? null,
        rawPayload: entry as any
      }
    });

    processed++;
    if (evaluation.status === "READY_TO_DISPUTE") ready++;
    if (evaluation.status === "EVIDENCE_MISSING") missing++;
  }

  return Response.json({
    ok: true,
    message:
      "Ingested " + processed + " deductions: " + ready + " ready to dispute, " +
      missing + " missing evidence"
  });
}
