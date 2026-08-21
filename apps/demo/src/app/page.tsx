import Link from "next/link";
import { deductions, retailers } from "@/lib/demo-data";
import { formatCurrency, statusClass, statusLabel } from "@/lib/format";

function getRetailer(retailerId: string) {
  return retailers.find(retailer => retailer.id === retailerId);
}

export default function CommandCenter() {
  const expiringSoon = deductions.filter(
    deduction => deduction.status === "EXPIRING_SOON"
  );

  const readyToDispute = deductions.filter(
    deduction => deduction.status === "READY_TO_DISPUTE"
  );

  const missingEvidence = deductions.filter(
    deduction => deduction.status === "EVIDENCE_MISSING"
  );

  const totalAtRisk = expiringSoon.reduce(
    (sum, deduction) => sum + Math.abs(deduction.amount),
    0
  );

  const totalReady = readyToDispute.reduce(
    (sum, deduction) => sum + Math.abs(deduction.amount),
    0
  );

  const mtdRecovered = 142500;

  const priorityItems = [
    ...expiringSoon,
    ...readyToDispute,
    ...missingEvidence
  ].slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Command Center
        </h1>
        <p className="mt-1 text-slate-400">
          Live deduction recovery workspace
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
          <p className="text-sm text-red-300">Expiring Soon</p>
          <p className="mt-2 text-3xl font-bold">
            {formatCurrency(totalAtRisk)}
          </p>
          <p className="mt-1 text-sm text-red-300/80">
            {expiringSoon.length} deductions need action
          </p>
        </div>

        <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-5">
          <p className="text-sm text-yellow-300">Missing Evidence</p>
          <p className="mt-2 text-3xl font-bold">
            {missingEvidence.length}
          </p>
          <p className="mt-1 text-sm text-yellow-300/80">
            Waiting on 3PL or carrier
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
          <p className="text-sm text-emerald-300">Ready to Dispute</p>
          <p className="mt-2 text-3xl font-bold">
            {formatCurrency(totalReady)}
          </p>
          <p className="mt-1 text-sm text-emerald-300/80">
            {readyToDispute.length} dispute packages ready
          </p>
        </div>

        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5">
          <p className="text-sm text-blue-300">MTD Recovered</p>
          <p className="mt-2 text-3xl font-bold">
            {formatCurrency(mtdRecovered)}
          </p>
          <p className="mt-1 text-sm text-blue-300/80">
            78% recovery rate
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/60">
        <div className="border-b border-white/10 p-5">
          <h2 className="text-lg font-semibold">
            Priority Action Queue
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="px-5 py-3 font-medium">Retailer</th>
                <th className="px-5 py-3 font-medium">Deduction</th>
                <th className="px-5 py-3 font-medium">Reason</th>
                <th className="px-5 py-3 font-medium">PO / Invoice</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Deadline</th>
                <th className="px-5 py-3 font-medium">Fault</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>

            <tbody>
              {priorityItems.map(deduction => {
                const retailer = getRetailer(deduction.retailerId);

                return (
                  <tr
                    key={deduction.id}
                    className="border-b border-white/5 last:border-0 hover:bg-white/5"
                  >
                    <td className="px-5 py-4">
                      <span
                        className="font-medium"
                        style={{ color: retailer?.color }}
                      >
                        {retailer?.name}
                      </span>
                    </td>

                    <td className="px-5 py-4 font-mono">
                      <Link
                        href={`/deductions/${deduction.id}`}
                        className="text-sky-300 underline underline-offset-2 hover:text-sky-200"
                      >
                        {deduction.externalId}
                      </Link>
                    </td>

                    <td className="px-5 py-4">
                      {deduction.reasonDescription}
                    </td>

                    <td className="px-5 py-4 font-mono text-slate-400">
                      {deduction.poNumber} / {deduction.invoiceNumber}
                    </td>

                    <td className="px-5 py-4 font-semibold">
                      {formatCurrency(deduction.amount)}
                    </td>

                    <td className="px-5 py-4 text-slate-400">
                      {new Date(deduction.deadlineDate).toLocaleDateString()}
                    </td>

                    <td className="px-5 py-4">
                      {deduction.faultParty.replace("_", " ")}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass(
                          deduction.status
                        )}`}
                      >
                        {statusLabel(deduction.status)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
