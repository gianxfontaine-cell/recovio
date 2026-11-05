import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DisputeActions } from "@/components/dispute-actions";
import { GenerateBackCharges } from "@/components/generate-back-charges";
import { DisputeReview } from "@/components/dispute-review";
import { formatMoney } from "@/lib/money";

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

export default async function DeductionDetailPage({
  params
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { tenant: true }
  });
  if (!user?.tenant) redirect("/");

  const deduction = await prisma.deduction.findFirst({
    where: { id: params.id, tenantId: user.tenant.id },
    include: { retailer: true, shipment: true, backCharge: true }
  });

  if (!deduction) redirect("/deductions");

  const dispute = await prisma.dispute.findUnique({
    where: { deductionId: deduction.id }
  });

  const canDispute = deduction.status === "READY_TO_DISPUTE" &&
    ["ADMIN", "FINANCE"].includes(user.role);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <Link
        href="/deductions"
        className="text-sm text-slate-400 hover:text-slate-200"
      >
        ← Back to deductions
      </Link>

      <div className="mt-4 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {deduction.externalId}
            </h1>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                statusStyles[deduction.status] ?? statusStyles.NEW
              }`}
            >
              {deduction.status.replace(/_/g, " ")}
            </span>
          </div>
          <p className="mt-2 text-slate-400">
            {deduction.retailer.name} • {deduction.reasonDescription}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-5 py-4 text-right">
          <p className="text-sm text-slate-400">Deduction Amount</p>
          <p className="text-3xl font-bold">{formatMoney(deduction.amount.abs())}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
            <h2 className="text-lg font-semibold">Deduction Details</h2>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Retailer</span>
                <span className="font-medium">{deduction.retailer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Reason Code</span>
                <span className="font-mono">{deduction.reasonCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">PO Number</span>
                <span className="font-mono">{deduction.poNumber ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Invoice Number</span>
                <span className="font-mono">{deduction.invoiceNumber ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Deadline</span>
                <span>
                  {new Date(deduction.deadlineDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Fault Party</span>
                <span>{deduction.faultParty.replace("_", " ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Evidence Score</span>
                <span className="font-semibold">{deduction.evidenceScore}/100</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
            <h2 className="text-lg font-semibold">Shipment & Evidence</h2>
            {deduction.shipment ? (
              <div className="mt-4 grid gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Carrier</span>
                  <span>{deduction.shipment.carrierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">3PL</span>
                  <span>{deduction.shipment.thirdPartyLogistics}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">PRO Number</span>
                  <span className="font-mono">{deduction.shipment.proNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">BOL Number</span>
                  <span className="font-mono">{deduction.shipment.bolNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">POD Status</span>
                  {deduction.shipment.podSigned ? (
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300">
                      Signed POD Available
                    </span>
                  ) : (
                    <span className="rounded-full border border-red-500/30 bg-red-500/15 px-3 py-1 text-xs font-medium text-red-300">
                      POD Missing
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-300">
                No shipment matched to this deduction.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
            <h2 className="text-lg font-semibold">Dispute Package</h2>
            <p className="mt-2 text-xs text-slate-500">
              {dispute
                ? "Dispute record status: " + dispute.status
                : "No dispute record yet for this deduction."}
            </p>
            <div className="mt-4">
              <DisputeActions
                deductionId={deduction.id}
                externalId={deduction.externalId}
                canDispute={canDispute}
                existingLetter={dispute?.letterHtml ?? null}
                existingStatus={dispute?.status ?? null}
              />
            </div>
            {dispute?.status === "PENDING_REVIEW" ? (
              <DisputeReview
                disputeId={dispute.id}
                canReview={["ADMIN", "FINANCE"].includes(user.role) && dispute.requestedById !== user.id}
              />
            ) : dispute?.reviewNotes ? (
              <p className="mt-4 border-t border-white/10 pt-4 text-sm text-slate-400">
                Review {dispute.status.toLowerCase()}: {dispute.reviewNotes}
              </p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
            <h2 className="text-lg font-semibold text-amber-200">3PL Back-charge</h2>
            {deduction.backCharge ? (
              <>
                <p className="mt-2 text-sm text-amber-100/70">
                  {deduction.backCharge.memoNumber} · {deduction.backCharge.thirdPartyLogistics} ·{" "}
                  {formatMoney(deduction.backCharge.amount, deduction.backCharge.currency)}
                </p>
                <a
                  href={`/api/back-charges/${deduction.backCharge.id}`}
                  className="mt-4 inline-block text-sm text-amber-300 underline underline-offset-2"
                >
                  Download debit memo
                </a>
                <p className="mt-2 text-xs text-slate-400">
                  Draft only; it has not been issued or sent.
                </p>
              </>
            ) : deduction.faultParty === "THREE_PL" &&
              deduction.amount.isNegative() &&
              deduction.shipment?.thirdPartyLogistics ? (
              <>
                <p className="mt-2 text-sm text-slate-300">
                  Generate a draft debit memo for {deduction.shipment.thirdPartyLogistics}.
                </p>
                {["ADMIN", "FINANCE"].includes(user.role) ? (
                  <div className="mt-4"><GenerateBackCharges deductionId={deduction.id} /></div>
                ) : null}
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-400">
                No matched 3PL-attributed charge is eligible for a debit memo.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
