import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function AuditPage() {
  const session = await auth()
  if (!session?.user?.email) redirect("/login")
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, tenantId: true, role: true, tenant: { select: { name: true } } }
  })
  if (!user?.tenantId || !user.tenant) redirect("/onboarding")
  if (user.role !== "ADMIN") redirect("/")

  const events = await prisma.auditEvent.findMany({
    where: { tenantId: user.tenantId },
    orderBy: { createdAt: "desc" },
    take: 100
  })
  const actorIds = [...new Set(events.map(event => event.actorId))]
  const actors = await prisma.user.findMany({
    where: { id: { in: actorIds }, tenantId: user.tenantId },
    select: { id: true, email: true, name: true }
  })
  const actorNames = new Map(actors.map(actor => [actor.id, actor.name ?? actor.email]))

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <Link href="/onboarding" className="text-sm text-slate-400 hover:text-white">← Onboarding</Link>
      <h1 className="mt-4 text-3xl font-bold">Audit log — {user.tenant.name}</h1>
      <p className="mt-2 text-sm text-slate-400">Latest 100 security and organization events for this workspace.</p>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/60">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-slate-400">
              <th className="px-5 py-3 font-medium">When</th>
              <th className="px-5 py-3 font-medium">Actor</th>
              <th className="px-5 py-3 font-medium">Event</th>
              <th className="px-5 py-3 font-medium">Resource</th>
            </tr>
          </thead>
          <tbody>
            {events.map(event => (
              <tr key={event.id} className="border-b border-white/5 last:border-0">
                <td className="whitespace-nowrap px-5 py-4 text-slate-400">{event.createdAt.toLocaleString()}</td>
                <td className="px-5 py-4">{actorNames.get(event.actorId) ?? "Former member"}</td>
                <td className="px-5 py-4 font-mono">{event.action}</td>
                <td className="px-5 py-4">{event.resourceType}{event.resourceId ? ` · ${event.resourceId}` : ""}</td>
              </tr>
            ))}
            {events.length === 0 ? (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-500">No audit events yet.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </main>
  )
}
