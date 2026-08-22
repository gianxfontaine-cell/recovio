import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCarrierAdapter } from "@recovio/integrations";

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

  const mock =
    process.env.NETSUITE_MOCK === "true" || !process.env.XPO_API_KEY;

  const shipments = await prisma.shipment.findMany({
    where: {
      tenantId: user.tenant.id,
      podSigned: false,
      proNumber: { not: null }
    }
  });

  let retrieved = 0;
  let missing = 0;

  for (const shipment of shipments) {
    if (!shipment.proNumber) {
      missing++;
      continue;
    }

    const adapter = getCarrierAdapter(shipment.carrierName ?? "", mock);
    if (!adapter) {
      missing++;
      continue;
    }

    const result = await adapter.fetchPod(shipment.proNumber);

    if (result.success && result.podUrl) {
      await prisma.shipment.update({
        where: { id: shipment.id },
        data: {
          podSigned: result.podSigned,
          podUrl: result.podUrl,
          deliveryDate: result.deliveryDate
            ? new Date(result.deliveryDate)
            : null
        }
      });
      retrieved++;
    } else {
      missing++;
    }
  }

  return Response.json({
    ok: true,
    message: "Retrieved " + retrieved + " PODs, " + missing + " still missing"
  });
}
