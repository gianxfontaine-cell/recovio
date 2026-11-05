import { requireTenantUser } from "@/lib/access"
import { prisma } from "@/lib/prisma"
import { isDemoMode } from "@/lib/mode"

export async function GET() {
  const access = await requireTenantUser(["ADMIN", "FINANCE", "OPERATIONS"])
  if (!access.ok) return access.response

  const credentials = await prisma.integrationCredential.findMany({
    where: { tenantId: access.user.tenantId },
    select: { provider: true, status: true, lastCheckedAt: true, lastError: true, updatedAt: true }
  })
  return Response.json({
    mode: isDemoMode() ? "mock" : "production",
    integrations: credentials
  }, {
    headers: { "Cache-Control": "private, no-store" }
  })
}
