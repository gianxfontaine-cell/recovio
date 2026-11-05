import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { InviteMember, OrganizationSetup } from "@/components/onboarding-workflow"
import { isDemoMode } from "@/lib/mode"

export const dynamic = "force-dynamic"

export default async function OnboardingPage() {
  const session = await auth()
  if (!session?.user?.email) redirect("/login")
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      tenant: {
        include: {
          users: { select: { id: true } },
          integrationCredentials: { select: { provider: true, status: true } },
          invitations: { where: { acceptedAt: null, expiresAt: { gt: new Date() } }, select: { id: true } }
        }
      }
    }
  })
  if (!user) redirect("/login")
  if (!user.tenant) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-wider text-sky-300">Customer onboarding</p>
        <h1 className="mt-3 text-3xl font-bold">Set up your organization</h1>
        <p className="mt-3 text-slate-400">Create your organization to establish a private workspace. You will become its administrator.</p>
        <OrganizationSetup />
      </main>
    )
  }
  if (user.role !== "ADMIN") redirect("/")

  const statuses = new Map(user.tenant.integrationCredentials.map(item => [item.provider, item.status]))
  const demoMode = isDemoMode()
  const checklist = [
    ["Organization profile", true],
    ["Invite your team", user.tenant.users.length > 1],
    ["Connect NetSuite", demoMode || statuses.get("netsuite") === "CONNECTED"],
    ["Configure carrier access", demoMode || statuses.get("xpo") === "CONNECTED" || statuses.get("estes") === "CONNECTED"],
    ["Review EDI setup", demoMode]
  ] as const

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Link href="/" className="text-sm text-slate-400 hover:text-white">← Workspace</Link>
      <h1 className="mt-4 text-3xl font-bold">Onboarding — {user.tenant.name}</h1>
      <p className="mt-2 text-slate-400">Complete your workspace setup. Integration credentials are stored encrypted and scoped to this organization.</p>
      <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
        <h2 className="text-lg font-semibold">Setup checklist</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {checklist.map(([label, complete]) => (
            <li key={label} className="flex items-center gap-3 rounded-lg bg-slate-950/60 p-3 text-sm">
              <span className={complete ? "text-emerald-300" : "text-slate-500"}>{complete ? "✓" : "○"}</span>
              <span>{label}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-slate-500">{user.tenant.invitations.length} pending invitation(s)</p>
      </section>
      <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
        <h2 className="text-lg font-semibold">Invite your team</h2>
        <p className="my-3 text-sm text-slate-400">Create a time-limited invitation link for the recipient to sign in and join with the assigned role.</p>
        <InviteMember />
      </section>
      <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
        <h2 className="text-lg font-semibold">Integration configuration</h2>
        <p className="mt-2 text-sm text-slate-400">Manage per-customer credentials and run diagnostics from the Integrations section.</p>
        <Link href="/integrations" className="mt-4 inline-block text-sm text-sky-300 underline underline-offset-2">Open integrations</Link>
      </section>
      <p className="mt-6 text-sm text-slate-500">
        <Link href="/audit" className="text-sky-300 underline underline-offset-2">View organization audit log</Link>
      </p>
    </main>
  )
}
