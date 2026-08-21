"use client";

import Link from "next/link";
import { useState } from "react";
import type { Deduction, Retailer, Shipment } from "@recovio/core";
import { deductions, retailers, shipments } from "@/lib/demo-data";
import { formatCurrency, statusClass, statusLabel } from "@/lib/format";

function formatDateTime(value: string | null): string {
  if (!value) {
    return "Unknown";
  }
  return new Date(value).toLocaleString();
}

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function buildDisputeLetter(input: {
  retailer: Retailer | undefined;
  deduction: Deduction;
  shipment: Shipment | undefined;
  paragraphs: string[];
  documents: { name: string; status: string }[];
}): string {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const evidenceRows = input.documents
    .filter(document => document.status === "AVAILABLE")
    .map(document => "<li>Enclosed: " + document.name + "</li>")
    .join("\n");

  const shipmentRows = input.shipment
    ? [
        "<tr><td class='label'>PRO number</td><td>" + input.shipment.proNumber + "</td></tr>",
        "<tr><td class='label'>BOL number</td><td>" + input.shipment.bolNumber + "</td></tr>",
        "<tr><td class='label'>Carrier</td><td>" + input.shipment.carrierName + "</td></tr>"
      ].join("\n")
    : "";

  return [
    "<!DOCTYPE html>",
    "<html lang='en'>",
    "<head>",
    "<meta charset='utf-8' />",
    "<title>Dispute " + input.deduction.externalId + "</title>",
    "<style>",
    "body { font-family: Arial, Helvetica, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 40px; }",
    ".letter { max-width: 720px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 48px; }",
    ".letterhead { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid #0f172a; padding-bottom: 12px; }",
    ".brand { font-size: 22px; font-weight: 700; letter-spacing: 0.5px; }",
    ".tag { color: #64748b; font-size: 12px; }",
    "h1 { font-size: 18px; margin: 32px 0 4px; }",
    ".meta { color: #475569; font-size: 13px; }",
    "p { line-height: 1.6; font-size: 14px; }",
    "table { width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 13px; }",
    "td { border: 1px solid #e2e8f0; padding: 8px 12px; }",
    "td.label { background: #f1f5f9; width: 180px; color: #475569; }",
    "ul { font-size: 14px; line-height: 1.7; }",
    ".signature { margin-top: 40px; font-size: 14px; }",
    ".footer { margin-top: 32px; color: #94a3b8; font-size: 11px; }",
    "</style>",
    "</head>",
    "<body>",
    "<div class='letter'>",
    "<div class='letterhead'>",
    "<span class='brand'>RECOVIO</span>",
    "<span class='tag'>Automated Deduction Recovery</span>",
    "</div>",
    "<p class='meta'>" + today + "</p>",
    "<h1>Re: Formal dispute of deduction " + input.deduction.externalId + "</h1>",
    "<p class='meta'>To: " + (input.retailer ? input.retailer.name : "Retailer") + " Vendor Disputes / Accounts Payable</p>",
    ...input.paragraphs.map(paragraph => "<p>" + paragraph + "</p>"),
    "<table>",
    "<tr><td class='label'>Deduction</td><td>" + input.deduction.externalId + "</td></tr>",
    "<tr><td class='label'>Amount disputed</td><td>" + formatCurrency(input.deduction.amount) + "</td></tr>",
    "<tr><td class='label'>PO number</td><td>" + input.deduction.poNumber + "</td></tr>",
    "<tr><td class='label'>Invoice number</td><td>" + input.deduction.invoiceNumber + "</td></tr>",
    shipmentRows,
    "</table>",
    "<p><strong>Enclosed evidence:</strong></p>",
    "<ul>",
    evidenceRows,
    "</ul>",
    "<p class='signature'>Sincerely,<br/>Accounts Receivable Team<br/>Prepared automatically by Recovio</p>",
    "<p class='footer'>This dispute was generated from matched ERP, 3PL, and carrier records. Original evidence available upon request.</p>",
    "</div>",
    "</body>",
    "</html>"
  ].join("\n");
}

function buildEvidenceRequest(input: {
  deduction: Deduction;
  shipment: Shipment | undefined;
  missing: string[];
}): string {
  return [
    "Subject: URGENT evidence request - " + input.deduction.externalId + " (PRO " + (input.shipment ? input.shipment.proNumber : "unknown") + ")",
    "",
    "Hello " + (input.shipment ? input.shipment.thirdPartyLogistics : "logistics partner") + " team,",
    "",
    "We received a retailer deduction and need documentation to dispute it before the deadline of " + new Date(input.deduction.deadlineDate).toLocaleDateString() + ".",
    "",
    "Shipment details:",
    "- PRO: " + (input.shipment ? input.shipment.proNumber : "unknown"),
    "- BOL: " + (input.shipment ? input.shipment.bolNumber : "unknown"),
    "- PO: " + input.deduction.poNumber,
    "- Invoice: " + input.deduction.invoiceNumber,
    "",
    "Missing documents:",
    ...input.missing.map(name => "- " + name),
    "",
    "Please reply with these documents as soon as possible so we can protect the dispute window.",
    "",
    "Sent via Recovio automated recovery."
  ].join("\n");
}

export default function DeductionDetailPage({
  params
}: {
  params: { id: string };
}) {
  const [notice, setNotice] = useState<string | null>(null);

  const deduction = deductions.find(item => item.id === params.id);

  if (!deduction) {
    return (
      <div className="space-y-4 p-6">
        <Link href="/" className="text-sm text-slate-400 hover:text-slate-200">
          ← Back to Command Center
        </Link>
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
          <h1 className="text-xl font-bold">Deduction not found</h1>
          <p className="mt-2 text-slate-400">
            The deduction you are looking for does not exist in this demo environment.
          </p>
        </div>
      </div>
    );
  }

  const retailer = retailers.find(item => item.id === deduction.retailerId);
  const shipment = shipments.find(item => item.deductionId === deduction.id);

  const documents = [
    { name: "Invoice", status: "AVAILABLE" },
    { name: "Purchase Order", status: "AVAILABLE" },
    { name: "ASN", status: "AVAILABLE" },
    { name: "Bill of Lading", status: shipment ? "AVAILABLE" : "MISSING" },
    { name: "Proof of Delivery", status: shipment && shipment.podSigned ? "AVAILABLE" : "MISSING" },
    { name: "Carrier Tracking", status: shipment ? "AVAILABLE" : "MISSING" }
  ];

  const missingDocuments = documents.filter(doc => doc.status === "MISSING");
  const canDispute = missingDocuments.length === 0;

  const disputeParagraphs = [
    "We are disputing " + (retailer ? retailer.name : "the retailer") + " deduction " + deduction.externalId + " in the amount of " + formatCurrency(deduction.amount) + " related to invoice " + deduction.invoiceNumber + " and PO " + deduction.poNumber + ".",
    "The stated reason for the deduction is " + deduction.reasonDescription.toLowerCase() + "."
  ];

  if (shipment && shipment.podSigned) {
    disputeParagraphs.push("The signed proof of delivery from " + shipment.carrierName + " confirms delivery and does not support the deduction as submitted.");
  }

  if (shipment && !shipment.podSigned) {
    disputeParagraphs.push("We are still awaiting proof of delivery from " + shipment.carrierName + ". The deduction should not be finalized without complete delivery evidence.");
  }

  if (deduction.faultParty === "THREE_PL") {
    disputeParagraphs.push("Internal shipment records indicate the third-party logistics provider may be responsible for this charge. Recovio has flagged this for 3PL back-charge review.");
  }

  if (deduction.faultParty === "RETAILER") {
    disputeParagraphs.push("Based on the available evidence, the retailer claim appears unsupported. We request reversal of this deduction.");
  }

  disputeParagraphs.push("Please provide any additional documentation supporting this deduction, or reverse the charge within the applicable dispute window.");

  const handleGeneratePackage = () => {
    downloadFile(
      "Recovio-Dispute-" + deduction.externalId + ".html",
      buildDisputeLetter({ retailer, deduction, shipment, paragraphs: disputeParagraphs, documents }),
      "text/html"
    );
    setNotice("Dispute package downloaded. Open the file in your browser and print to PDF.");
  };

  const handleEvidenceRequest = () => {
    downloadFile(
      "Recovio-Evidence-Request-" + deduction.externalId + ".txt",
      buildEvidenceRequest({ deduction, shipment, missing: missingDocuments.map(doc => doc.name) }),
      "text/plain"
    );
    setNotice("Evidence request downloaded. Send it to your 3PL or carrier.");
  };

  return (
    <div className="space-y-6 p-6">
      <Link href="/" className="inline-block text-sm text-slate-400 hover:text-slate-200">
        ← Back to Command Center
      </Link>

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{deduction.externalId}</h1>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass(deduction.status)}`}>
              {statusLabel(deduction.status)}
            </span>
          </div>
          <p className="mt-2 text-slate-400">
            <span style={{ color: retailer?.color }}>{retailer?.name}</span> • {deduction.reasonDescription}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-5 py-4 text-right">
          <p className="text-sm text-slate-400">Deduction Amount</p>
          <p className="text-3xl font-bold">{formatCurrency(deduction.amount)}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
            <h2 className="text-lg font-semibold">Deduction Details</h2>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Retailer</span><span className="font-medium" style={{ color: retailer?.color }}>{retailer?.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Reason Code</span><span className="font-mono">{deduction.reasonCode}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">PO Number</span><span className="font-mono">{deduction.poNumber}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Invoice Number</span><span className="font-mono">{deduction.invoiceNumber}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Deadline</span><span>{new Date(deduction.deadlineDate).toLocaleDateString()}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Fault Party</span><span>{deduction.faultParty.replace("_", " ")}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Evidence Score</span><span className="font-semibold">{deduction.evidenceScore}/100</span></div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
            <h2 className="text-lg font-semibold">Shipment & Evidence</h2>
            {shipment ? (
              <div className="mt-4 grid gap-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">Carrier</span><span>{shipment.carrierName}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">3PL</span><span>{shipment.thirdPartyLogistics}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">PRO Number</span><span className="font-mono">{shipment.proNumber}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">BOL Number</span><span className="font-mono">{shipment.bolNumber}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Appointment</span><span>{formatDateTime(shipment.appointmentTime)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Delivery</span><span>{formatDateTime(shipment.deliveryDate)}</span></div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">POD Status</span>
                  {shipment.podSigned ? (
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300">Signed POD Available</span>
                  ) : (
                    <span className="rounded-full border border-red-500/30 bg-red-500/15 px-3 py-1 text-xs font-medium text-red-300">POD Missing</span>
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
                <div key={document.name} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                  <span>{document.name}</span>
                  {document.status === "AVAILABLE" ? (
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300">Available</span>
                  ) : (
                    <span className="rounded-full border border-red-500/30 bg-red-500/15 px-3 py-1 text-xs font-medium text-red-300">Missing</span>
                  )}
                </div>
              ))}
            </div>

            {missingDocuments.length > 0 ? (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                Missing evidence: {missingDocuments.map(doc => doc.name).join(", ")}
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
                onClick={handleGeneratePackage}
                disabled={!canDispute}
                className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                  canDispute
                    ? "bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
                    : "cursor-not-allowed bg-slate-700 text-slate-400"
                }`}
              >
                Generate Dispute Package
              </button>

              <button
                onClick={handleEvidenceRequest}
                disabled={missingDocuments.length === 0}
                className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                  missingDocuments.length > 0
                    ? "border border-white/10 bg-white/5 hover:bg-white/10"
                    : "cursor-not-allowed border border-white/5 bg-white/5 text-slate-500"
                }`}
              >
                Send Evidence Request
              </button>

              <button className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold hover:bg-white/10">
                Add Internal Note
              </button>
            </div>

            {notice ? (
              <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
                {notice}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
