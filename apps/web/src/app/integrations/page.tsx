import { requireTenantUser } from "@/lib/access"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { IntegrationSettings } from "@/components/integration-settings"
import { isDemoMode } from "@/lib/mode"

export const dynamic = "force-dynamic"

export default async function IntegrationsPage() {
  const access = await requireTenantUser(["ADMIN"])
  if (!access.ok) {
    if (access.response.status === 401) redirect("/login")
    redirect("/")
  }
  const integrations = await prisma.integrationCredential.findMany({
    where: { tenantId: access.user.tenantId },
    select: { provider: true, status: true, lastCheckedAt: true, lastError: true }
  })
  const serializedIntegrations = integrations.map(integration => ({
    ...integration,
    lastCheckedAt: integration.lastCheckedAt?.toISOString() ?? null
  }))
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Link href="/onboarding" className="text-sm text-slate-400 hover:text-white">← Onboarding</Link>
      <h1 className="mt-4 text-3xl font-bold">Integrations</h1>
      <p className="mb-6 mt-2 text-slate-400">Configure credentials for {access.user.tenant.name}. Secrets are encrypted at rest and never returned to the browser.</p>
      <IntegrationSettings mode={isDemoMode() ? "mock" : "production"} initialIntegrations={serializedIntegrations} />
    </main>
  )
}
