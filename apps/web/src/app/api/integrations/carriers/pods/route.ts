import { requireTenantUser, recordAuditEvent } from "@/lib/access";
import { decryptCredentials } from "@/lib/credentials";
import { prisma } from "@/lib/prisma";
import { getCarrierAdapter } from "@recovio/integrations";
import { isDemoMode } from "@/lib/mode";

export async function POST() {
  const access = await requireTenantUser(["ADMIN", "OPERATIONS"]);
  if (!access.ok) return access.response;
  const mock = isDemoMode();

  const shipments = await prisma.shipment.findMany({
    where: {
      tenantId: access.user.tenantId,
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

    const provider = (shipment.carrierName ?? "").toUpperCase().includes("XPO") ? "xpo" :
      (shipment.carrierName ?? "").toUpperCase().includes("ESTES") ? "estes" : null;
    if (!provider) {
      missing++;
      continue;
    }
    let apiKey: string | undefined;
    if (!mock) {
      const saved = await prisma.integrationCredential.findUnique({
        where: { tenantId_provider: { tenantId: access.user.tenantId, provider } }
      });
      if (!saved) {
        return Response.json({ error: `Configure ${provider} credentials before retrieving PODs` }, { status: 409 });
      }
      apiKey = decryptCredentials(
        saved.encryptedCredentials,
        `${access.user.tenantId}:${provider}`
      ).apiKey;
      if (!apiKey) return Response.json({ error: `Saved ${provider} credentials are incomplete` }, { status: 409 });
    }

    const adapter = getCarrierAdapter(shipment.carrierName ?? "", mock, apiKey);
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

  await recordAuditEvent({
    tenantId: access.user.tenantId,
    actorId: access.user.id,
    action: "integration.carrier_pods_sync",
    resourceType: "shipment",
    metadata: { retrieved, missing, mode: mock ? "mock" : "production" }
  });
  return Response.json({
    ok: true,
    message: "Retrieved " + retrieved + " PODs, " + missing + " still missing"
  });
}
