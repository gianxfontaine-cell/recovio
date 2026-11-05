import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { GenerateBackCharges } from "@/components/generate-back-charges"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Prisma } from "@prisma/client"
import { formatMoney } from "@/lib/money"

export const dynamic = "force-dynamic"

const statusStyles: Record<string, string> = {
  DRAFT: "border-amber-500/30 bg-amber-500/15 text-amber-300",
  ISSUED: "border-blue-500/30 bg-blue-500/15 text-blue-300",
  PAID: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
  VOID: "border-slate-500/30 bg-slate-500/15 text-slate-300"
}

export default async function BackChargesPage() {
  const session = await auth()
  if (!session?.user?.email) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { tenant: true }
  })
  if (!user?.tenant) redirect("/")

  const backCharges = await prisma.backCharge.findMany({
    where: { tenantId: user.tenant.id },
    include: {
      deduction: {
        include: {
          retailer: { select: { name: true } },
          shipment: { select: { proNumber: true, thirdPartyLogistics: true } }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  })
  const total = backCharges.reduce(
    (sum, item) => sum.plus(item.amount),
    new Prisma.Decimal(0)
  )

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <Link href="/" className="text-sm text-slate-400 hover:text-slate-200">
            ← Back to workspace
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            3PL Back-charges — {user.tenant.name}
          </h1>
          <p className="mt-1 max-w-2xl text-slate-400">
            Draft debit memos for retailer deductions attributed to a matched 3PL.
            New eligible deductions are added when the EDI feed is processed.
          </p>
        </div>
        {["ADMIN", "FINANCE"].includes(user.role) ? <GenerateBackCharges /> : null}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
          <p className="text-sm text-slate-400">Generated memos</p>
          <p className="mt-1 text-2xl font-semibold">{backCharges.length}</p>
        </section>
        <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
          <p className="text-sm text-slate-400">Total requested</p>
          <p className="mt-1 text-2xl font-semibold">
            {formatMoney(total)}
          </p>
        </section>
      </div>

      {backCharges.length === 0 ? (
        <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-10 text-center">
          <h2 className="text-lg font-semibold">No debit memos yet</h2>
          <p className="mt-2 text-sm text-slate-400">
            Run the engine to generate draft memos for eligible 3PL-caused deductions.
            Drafts are not sent or posted automatically.
          </p>
        </section>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/60">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="px-5 py-3 font-medium">Memo</th>
                <th className="px-5 py-3 font-medium">3PL</th>
                <th className="px-5 py-3 font-medium">Deduction</th>
                <th className="px-5 py-3 font-medium">Retailer</th>
                <th className="px-5 py-3 font-medium">Invoice / PRO</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Document</th>
              </tr>
            </thead>
            <tbody>
              {backCharges.map(backCharge => (
                <tr key={backCharge.id} className="border-b border-white/5 last:border-0">
                  <td className="whitespace-nowrap px-5 py-4 font-mono">
                    {backCharge.memoNumber}
                  </td>
                  <td className="px-5 py-4 font-medium">{backCharge.thirdPartyLogistics}</td>
                  <td className="px-5 py-4">
                    <Link
                      href={`/deductions/${backCharge.deductionId}`}
                      className="text-sky-300 underline underline-offset-2"
                    >
                      {backCharge.deduction.externalId}
                    </Link>
                  </td>
                  <td className="px-5 py-4">{backCharge.deduction.retailer.name}</td>
                  <td className="px-5 py-4 text-slate-400">
                    {backCharge.deduction.invoiceNumber ?? "—"}
                    <div className="font-mono text-xs">
                      {backCharge.deduction.shipment?.proNumber ?? "No PRO"}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 font-semibold">
                    {formatMoney(backCharge.amount, backCharge.currency)}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${
                        statusStyles[backCharge.status] ?? statusStyles.DRAFT
                      }`}
                    >
                      {backCharge.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <a
                      href={`/api/back-charges/${backCharge.id}`}
                      className="text-amber-300 underline underline-offset-2 hover:text-amber-200"
                    >
                      Download
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
