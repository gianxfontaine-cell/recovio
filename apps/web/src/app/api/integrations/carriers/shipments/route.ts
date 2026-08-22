import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// In production this comes from the 3PL WMS (ShipBob, Hub Group, etc).
// Mock mode maps synced invoices to realistic shipments.
const MOCK_SHIPMENTS: Record<
  string,
  { pro: string; carrier: string; threePl: string }
> = {
  "INV-10042": { pro: "PRO-884721-XPO", carrier: "XPO Logistics", threePl: "ShipBob" },
  "INV-10043": { pro: "PRO-773822-EST", carrier: "Estes Express", threePl: "Hub Group" },
  "INV-10044": { pro: "PRO-662911-XPO", carrier: "XPO Logistics", threePl: "ShipBob" },
  "INV-10045": { pro: "PRO-551822-EST", carrier: "Estes Express", threePl: "Hub Group" },
  "INV-10048": { pro: "PRO-440733-XPO", carrier: "XPO Logistics", threePl: "Geodis" }
};

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

  const invoices = await prisma.invoice.findMany({
    where: { tenantId: user.tenant.id }
  });

  let created = 0;

  for (const invoice of invoices) {
    const mapping = MOCK_SHIPMENTS[invoice.invoiceNumber];
    if (!mapping) continue;

    const existing = await prisma.shipment.findFirst({
      where: { tenantId: user.tenant.id, proNumber: mapping.pro }
    });
    if (existing) continue;

    const appointment = new Date(invoice.invoiceDate);
    appointment.setDate(appointment.getDate() + 5);
    appointment.setHours(10, 0, 0, 0);

    await prisma.shipment.create({
      data: {
        tenantId: user.tenant.id,
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

  return Response.json({
    ok: true,
    message: "Synced " + created + " new shipments from 3PL (mock)"
  });
}
