import Link from "next/link";
import { deductions, retailers, shipments } from "@/lib/demo-data";
import { formatCurrency, statusClass, statusLabel } from "@/lib/format";

type DocumentItem = {
  name: string;
  status: "AVAILABLE" | "MISSING";
};

function formatDateTime(value: string | null): string {
  if (!value) {
    return "Unknown";
  }

  return new Date(value).toLocaleString();
}

export default function DeductionDetailPage({
  params
}: {
  params: { id: string };
}) {
  const deduction = deductions.find(item => item.id === params.id);

  if (!deduction) {
    return (
      <div className="space-y-4 p-6">
        <Link
          href="/"
          className="text-sm text-slate-400 hover:text-slate-200"
        >
          ← Back to Command Center
        </Link>

        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
          <h1 className="text-xl font-bold">Deduction not found</h1>
          <p className="mt-2 text-slate-400">
            The deduction you are looking for does not exist in this demo
            environment.
          </p>
        </div>
      </div>
    );
  }

  const retailer = retailers.find(item => item.id === deduction.retailerId);
  const shipment = shipments.find(item => item.deductionId === deduction.id);

  const documents: DocumentItem[] = [
    {
      name: "Invoice",
      status: "AVAILABLE"
    },
    {
      name: "Purchase Order",
      status: "AVAILABLE"
    },
    {
      name: "ASN",
      status: deduction.reasonCode === "LATE_ASN" ? "AVAILABLE" : "AVAILABLE"
    },
    {
      name: "Bill of Lading",
      status: shipment ? "AVAILABLE" : "MISSING"
    },
    {
      name: "Proof of Delivery",
      status: shipment?.podSigned ? "AVAILABLE" : "MISSING"
    },
    {
      name: "Carrier Tracking",
      status: shipment ? "AVAILABLE" : "MISSING"
    }
  ];

  const missingDocuments = documents.filter(
    document => document.status === "MISSING"
  );

  const canDispute = missingDocuments.length === 0;

  const disputeParagraphs: string[] = [
    `We are disputing ${retailer?.name} deduction ${deduction.externalId} in the amount of ${formatCurrency(
      deduction.amount
    )} related to invoice ${deduction.invoiceNumber} and PO ${deduction.poNumber}.`,
    `The stated reason for the deduction is ${deduction.reasonDescription.toLowerCase()}.`
  ];

  if (shipment?.podSigned) {
    disputeParagraphs.push(
      `The signed proof of delivery from ${shipment.carrierName} confirms delivery and does not support the deduction as submitted.`
    );
  }

  if (shipment && !shipment.podSigned) {
    disputeParagraphs.push(
      `We are still awaiting proof of delivery from ${shipment.carrierName}. The deduction should not be finalized without complete delivery evidence.`
    );
  }

  if (deduction.faultParty === "THREE_PL") {
    disputeParagraphs.push(
      `Internal shipment records indicate the third-party logistics provider may be responsible for this charge. Recovio has flagged this for 3PL back-charge review.`
    );
  }

  if (deduction.faultParty === "RETAILER") {
    disputeParagraphs.push(
      `Based on the available evidence, the retailer claim appears unsupported. We request reversal of this deduction.`
    );
  }

  disputeParagraphs.push(
    `Please provide any additional documentation supporting this deduction, or reverse the charge within the applicable dispute window.`
  );

  return (
    <div className="space-y-6">
      <Link
        href="/"
        className="inline-block text-sm text-slate-400 hover:text-slate-200"
      >
        ← Back to Command Center
      </Link>

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {deduction.externalId}
            </h1>

            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass(
                deduction.status
              )}`}
            >
              {statusLabel(deduction.status)}
            </span>
          </div>

          <p className="mt-2 text-slate-400">
            <span style={{ color: retailer?.color }}>
              {retailer?.name}
            </span>{" "}
            • {deduction.reasonDescription}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-5 py-4 text-right">
          <p className="text-sm text-slate-400">Deduction Amount</p>
          <p className="text-3xl font-bold">
            {formatCurrency(deduction.amount)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
            <h2 className="text-lg font-semibold">Deduction Details</h2>

            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">Retailer</span>
                <span className="font-medium" style={{ color: retailer?.color }}>
                  {retailer?.name}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">Reason Code</span>
                <span className="font-mono">{deduction.reasonCode}</span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">PO Number</span>
                <span className="font-mono">{deduction.poNumber}</span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">Invoice Number</span>
                <span className="font-mono">{deduction.invoiceNumber}</span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">Deadline</span>
                <span>
                  {new Date(deduction.deadlineDate).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">Fault Party</span>
                <span>{deduction.faultParty.replace("_", " ")}</span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">Evidence Score</span>
                <span className="font-semibold">
                  {deduction.evidenceScore}/100
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
            <h2 className="text-lg font-semibold">Shipment & Evidence</h2>

            {shipment ? (
              <div className="mt-4 grid gap-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-400">Carrier</span>
                  <span>{shipment.carrierName}</span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-400">3PL</span>
                  <span>{shipment.thirdPartyLogistics}</span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-400">PRO Number</span>
                  <span className="font-mono">{shipment.proNumber}</span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-400">BOL Number</span>
                  <span className="font-mono">{shipment.bolNumber}</span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-400">Appointment</span>
                  <span>{formatDateTime(shipment.appointmentTime)}</span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-400">Delivery</span>
                  <span>{formatDateTime(shipment.deliveryDate)}</span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-400">POD Status</span>
                  {shipment.podSigned ? (
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
                No shipment record has been matched to this deduction yet.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
            <h2 className="text-lg font-semibold">Evidence Documents</h2>

            <div className="mt-4 space-y-3">
              {documents.map(document => (
                <div
                  key={document.name}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                >
                  <span>{document.name}</span>

                  {document.status === "AVAILABLE" ? (
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300">
                      Available
                    </span>
                  ) : (
                    <span className="rounded-full border border-red-500/30 bg-red-500/15 px-3 py-1 text-xs font-medium text-red-300">
                      Missing
                    </span>
                  )}
                </div>
              ))}
            </div>

            {missingDocuments.length > 0 ? (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                Missing evidence:{" "}
                {missingDocuments
                  .map(document => document.name)
                  .join(", ")}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
                Evidence package is complete.
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
            <h2 className="text-lg font-semibold">Dispute Preview</h2>

            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
              {disputeParagraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
            <h2 className="text-lg font-semibold">Actions</h2>

            <div className="mt-4 space-y-3">
              <button
                disabled={!canDispute}
                className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                  canDispute
                    ? "bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
                    : "cursor-not-allowed bg-slate-700 text-slate-400"
                }`}
              >
                Generate Dispute Package
              </button>

              <button className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold hover:bg-white/10">
                Send Evidence Request
              </button>

              <button className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold hover:bg-white/10">
                Add Internal Note
              </button>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              Buttons are visual only in this coding session. We will wire
              them up later.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}