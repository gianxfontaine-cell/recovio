import { requireTenantUser, recordAuditEvent } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { isDemoMode } from "@/lib/mode";

// In production this comes from the 3PL WMS (ShipBob, Hub Group, etc).
// Mock mode maps synced invoices to realistic shipments.
const MOCK_SHIPMENTS: Record<
  string,
  { pro: string; carrier: string; threePl: string }
> = {
  "INV-10042": { pro: "PRO-884721-XPO", carrier: "XPO Logistics", threePl: "ShipBob" },
  "INV-10043": { pro: "PRO-773822-EST", carrier: "Estes Express", threePl: "Hub Group" },
  "INV-10044": { pro: "PRO-662911-XPO", carrier: "XPO Logistics", threePl: "Hub Group" },
  "INV-10045": { pro: "PRO-551822-EST", carrier: "Estes Express", threePl: "Hub Group" },
  "INV-10048": { pro: "PRO-440733-XPO", carrier: "XPO Logistics", threePl: "Geodis" }
};

export async function POST() {
  const access = await requireTenantUser(["ADMIN", "OPERATIONS"]);
  if (!access.ok) return access.response;
  if (!isDemoMode()) {
    return Response.json({ error: "Shipment fixture sync is available only in demo mode" }, { status: 409 });
  }

  const invoices = await prisma.invoice.findMany({
    where: { tenantId: access.user.tenantId }
  });

  let created = 0;
  let updated = 0;

  for (const invoice of invoices) {
    const mapping = MOCK_SHIPMENTS[invoice.invoiceNumber];
    if (!mapping) continue;

    const existing = await prisma.shipment.findFirst({
      where: { tenantId: access.user.tenantId, proNumber: mapping.pro }
    });
    if (existing) {
      if (
        existing.thirdPartyLogistics !== mapping.threePl ||
        existing.carrierName !== mapping.carrier
      ) {
        await prisma.shipment.update({
          where: { id: existing.id },
          data: {
            carrierName: mapping.carrier,
            thirdPartyLogistics: mapping.threePl
          }
        });
        updated++;
      }
      continue;
    }

    const appointment = new Date(invoice.invoiceDate);
    appointment.setDate(appointment.getDate() + 5);
    appointment.setHours(10, 0, 0, 0);

    await prisma.shipment.create({
      data: {
        tenantId: access.user.tenantId,
        proNumber: mapping.pro,
        bolNumber: "BOL-" + (mapping.pro.split("-")[1] ?? "000000"),
        carrierName: mapping.carrier,
        thirdPartyLogistics: mapping.threePl,
        podSigned: false,
        appointmentTime: appointment
      }
    });

    created++;
  }

  await recordAuditEvent({
    tenantId: access.user.tenantId,
    actorId: access.user.id,
    action: "integration.carrier_shipments_sync",
    resourceType: "shipment",
    metadata: { created, updated, mode: "mock" }
  });
  return Response.json({
    ok: true,
    message:
      "Synced " + created + " new shipments and updated " + updated + " existing shipment mappings (mock)"
  });
}
