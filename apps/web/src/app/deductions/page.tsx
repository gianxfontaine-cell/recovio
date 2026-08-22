import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { EdiSync } from "@/components/edi-sync";

export const dynamic = "force-dynamic";

const statusStyles: Record<string, string> = {
  READY_TO_DISPUTE: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
  EVIDENCE_MISSING: "border-yellow-500/30 bg-yellow-500/15 text-yellow-300",
  NEW: "border-slate-500/30 bg-slate-500/15 text-slate-300",
  SUBMITTED: "border-blue-500/30 bg-blue-500/15 text-blue-300",
  WON: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
  LOST: "border-red-500/30 bg-red-500/15 text-red-300",
  EXPIRING_SOON: "border-red-500/30 bg-red-500/15 text-red-300"
};

export default async function DeductionsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { tenant: true }
  });

  if (!user?.tenant) redirect("/");

  const deductions = await prisma.deduction.findMany({
    where: { tenantId: user.tenant.id },
    include: { retailer: true },
    orderBy: { deadlineDate: "asc" }
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-slate-400 hover:text-slate-200">
            ← Back to workspace
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Deductions — {user.tenant.name}
          </h1>
          <p className="mt-1 text-slate-400">
            Auto-matched, scored, and fault-assigned by the Recovio engine.
          </p>
        </div>
        <div className="w-72">
          <EdiSync />
        </div>
      </div>

      {deductions.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-10 text-center text-slate-400">
          No deductions yet. Run the full pipeline: NetSuite sync → shipment
          sync → POD fetch → then simulate the EDI 820 feed.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/60">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="px-5 py-3 font-medium">Retailer</th>
                <th className="px-5 py-3 font-medium">Deduction</th>
                <th className="px-5 py-3 font-medium">Reason</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Fault</th>
                <th className="px-5 py-3 font-medium">Score</th>
                <th className="px-5 py-3 font-medium">Deadline</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {deductions.map(deduction => (
                <tr
                  key={deduction.id}
                  className="border-b border-white/5 last:border-0 hover:bg-white/5"
                >
                  <td className="px-5 py-4 font-medium">
                    {deduction.retailer.name}
                  </td>
                  <td className="px-5 py-4 font-mono">
                    <Link
                      href={"/deductions/" + deduction.id}
                      className="text-sky-300 underline underline-offset-2 hover:text-sky-200"
                    >
                      {deduction.externalId}
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    {deduction.reasonDescription}
                  </td>
                  <td className="px-5 py-4 font-semibold">
                    {"$" + Math.abs(deduction.amount).toLocaleString()}
                  </td>
                  <td className="px-5 py-4">
                    {deduction.faultParty.replace("_", " ")}
                  </td>
                  <td className="px-5 py-4 font-mono">
                    {deduction.evidenceScore}
                  </td>
                  <td className="px-5 py-4 text-slate-400">
                    {new Date(deduction.deadlineDate).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${
                        statusStyles[deduction.status] ?? statusStyles.NEW
                      }`}
                    >
                      {deduction.status.replace(/_/g, " ")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
