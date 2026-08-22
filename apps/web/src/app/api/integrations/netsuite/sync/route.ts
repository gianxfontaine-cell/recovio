import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NetSuiteClient } from "@recovio/integrations";

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
    process.env.NETSUITE_MOCK === "true" || !process.env.NETSUITE_ACCOUNT_ID;

  const client = new NetSuiteClient(
    {
      accountId: process.env.NETSUITE_ACCOUNT_ID ?? "MOCK",
      consumerKey: process.env.NETSUITE_CONSUMER_KEY ?? "",
      consumerSecret: process.env.NETSUITE_CONSUMER_SECRET ?? "",
      tokenId: process.env.NETSUITE_TOKEN_ID ?? "",
      tokenSecret: process.env.NETSUITE_TOKEN_SECRET ?? ""
    },
    mock
  );

  try {
    const invoices = await client.queryInvoices();

    for (const inv of invoices) {
      await prisma.invoice.upsert({
        where: {
          tenantId_netsuiteId: {
            tenantId: user.tenant.id,
            netsuiteId: inv.netsuiteId
          }
        },
        update: {
          totalAmount: inv.totalAmount,
          poNumber: inv.poNumber,
          customerName: inv.customerName
        },
        create: {
          tenantId: user.tenant.id,
          netsuiteId: inv.netsuiteId,
          invoiceNumber: inv.invoiceNumber,
          poNumber: inv.poNumber,
          customerName: inv.customerName,
          totalAmount: inv.totalAmount,
          invoiceDate: new Date(inv.invoiceDate)
        }
      });
    }

    return Response.json({
      ok: true,
      synced: invoices.length,
      mode: mock ? "mock" : "live"
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
