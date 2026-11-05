import { requireTenantUser, recordAuditEvent } from "@/lib/access";
import { decryptCredentials } from "@/lib/credentials";
import { prisma } from "@/lib/prisma";
import { NetSuiteClient } from "@recovio/integrations";
import { parseMoney } from "@/lib/money";
import { isDemoMode } from "@/lib/mode";

export async function POST() {
  const access = await requireTenantUser(["ADMIN", "OPERATIONS"]);
  if (!access.ok) return access.response;

  const mock = isDemoMode();
  let credentialId: string | undefined;
  let credentials = {
    accountId: "MOCK",
    consumerKey: "",
    consumerSecret: "",
    tokenId: "",
    tokenSecret: ""
  };
  if (!mock) {
    const saved = await prisma.integrationCredential.findUnique({
      where: { tenantId_provider: { tenantId: access.user.tenantId, provider: "netsuite" } }
    });
    if (!saved) return Response.json({ error: "Configure NetSuite credentials before syncing" }, { status: 409 });
    credentialId = saved.id;
    const decrypted = decryptCredentials(
      saved.encryptedCredentials,
      `${access.user.tenantId}:netsuite`
    );
    const fields = ["accountId", "consumerKey", "consumerSecret", "tokenId", "tokenSecret"] as const;
    if (fields.some(field => !decrypted[field])) {
      return Response.json({ error: "Saved NetSuite credentials are incomplete" }, { status: 409 });
    }
    credentials = {
      accountId: decrypted.accountId,
      consumerKey: decrypted.consumerKey,
      consumerSecret: decrypted.consumerSecret,
      tokenId: decrypted.tokenId,
      tokenSecret: decrypted.tokenSecret
    };
  }
  const client = new NetSuiteClient(credentials, mock);

  try {
    const invoices = await client.queryInvoices();
    if (credentialId) {
      await prisma.integrationCredential.update({
        where: { id: credentialId },
        data: { status: "CONNECTED", lastCheckedAt: new Date(), lastError: null }
      });
    }

    for (const inv of invoices) {
      const totalAmount = parseMoney(inv.totalAmount)
      if (!totalAmount) throw new Error("NetSuite returned an invalid invoice amount")
      await prisma.invoice.upsert({
        where: {
          tenantId_netsuiteId: {
            tenantId: access.user.tenantId,
            netsuiteId: inv.netsuiteId
          }
        },
        update: {
          totalAmount,
          poNumber: inv.poNumber,
          customerName: inv.customerName
        },
        create: {
          tenantId: access.user.tenantId,
          netsuiteId: inv.netsuiteId,
          invoiceNumber: inv.invoiceNumber,
          poNumber: inv.poNumber,
          customerName: inv.customerName,
          totalAmount,
          invoiceDate: new Date(inv.invoiceDate)
        }
      });
    }

    await recordAuditEvent({
      tenantId: access.user.tenantId,
      actorId: access.user.id,
      action: "integration.netsuite_sync",
      resourceType: "invoice",
      metadata: { count: invoices.length, mode: mock ? "mock" : "production" }
    });
    return Response.json({
      ok: true,
      synced: invoices.length,
      mode: mock ? "mock" : "live"
    });
  } catch (error: unknown) {
    console.error("NetSuite sync failed", error instanceof Error ? error.name : "Unknown error");
    if (credentialId) {
      await prisma.integrationCredential.update({
        where: { id: credentialId },
        data: {
          status: "ERROR",
          lastCheckedAt: new Date(),
          lastError: "Synchronization failed; run diagnostics for details."
        }
      });
    }
    await recordAuditEvent({
      tenantId: access.user.tenantId,
      actorId: access.user.id,
      action: "integration.netsuite_sync_failed",
      resourceType: "invoice",
      metadata: { mode: mock ? "mock" : "production" }
    });
    return Response.json({ error: "NetSuite synchronization failed; run diagnostics for connection details" }, { status: 502 });
  }
}
