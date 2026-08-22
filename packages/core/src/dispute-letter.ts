export interface DisputeLetterInput {
  retailerName: string;
  externalId: string;
  amount: number;
  reasonDescription: string;
  invoiceNumber: string | null;
  poNumber: string | null;
  proNumber: string | null;
  bolNumber: string | null;
  carrierName: string | null;
  podSigned: boolean;
  faultParty: string;
}

export function buildDisputeParagraphs(input: DisputeLetterInput): string[] {
  const paragraphs: string[] = [];

  paragraphs.push(
    `We are disputing ${input.retailerName} deduction ${input.externalId} in the amount of $${Math.abs(input.amount).toLocaleString()} related to invoice ${input.invoiceNumber ?? "unknown"} and PO ${input.poNumber ?? "unknown"}.`
  );

  paragraphs.push(
    `The stated reason for the deduction is ${input.reasonDescription.toLowerCase()}.`
  );

  if (input.podSigned) {
    paragraphs.push(
      `The signed proof of delivery from ${input.carrierName ?? "the carrier"} confirms delivery and does not support the deduction as submitted.`
    );
  }

  if (input.faultParty === "THREE_PL") {
    paragraphs.push(
      "Internal shipment records indicate the third-party logistics provider may be responsible for this charge. Recovio has flagged this for 3PL back-charge review."
    );
  }

  if (input.faultParty === "RETAILER") {
    paragraphs.push(
      "Based on the available evidence, the retailer claim appears unsupported. We request reversal of this deduction."
    );
  }

  paragraphs.push(
    "Please provide any additional documentation supporting this deduction, or reverse the charge within the applicable dispute window."
  );

  return paragraphs;
}

export function buildDisputeLetterHtml(input: DisputeLetterInput): string {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const paragraphs = buildDisputeParagraphs(input)
    .map(p => "<p>" + p + "</p>")
    .join("\n");

  const shipmentRows =
    input.proNumber || input.bolNumber
      ? [
          input.proNumber ? "<tr><td class='label'>PRO number</td><td>" + input.proNumber + "</td></tr>" : "",
          input.bolNumber ? "<tr><td class='label'>BOL number</td><td>" + input.bolNumber + "</td></tr>" : "",
          input.carrierName ? "<tr><td class='label'>Carrier</td><td>" + input.carrierName + "</td></tr>" : ""
        ].join("\n")
      : "";

  return [
    "<!DOCTYPE html>",
    "<html lang='en'>",
    "<head>",
    "<meta charset='utf-8' />",
    "<title>Dispute " + input.externalId + "</title>",
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
    "<h1>Re: Formal dispute of deduction " + input.externalId + "</h1>",
    "<p class='meta'>To: " + input.retailerName + " Vendor Disputes / Accounts Payable</p>",
    paragraphs,
    "<table>",
    "<tr><td class='label'>Deduction</td><td>" + input.externalId + "</td></tr>",
    "<tr><td class='label'>Amount disputed</td><td>$" + Math.abs(input.amount).toLocaleString() + "</td></tr>",
    "<tr><td class='label'>PO number</td><td>" + (input.poNumber ?? "—") + "</td></tr>",
    "<tr><td class='label'>Invoice number</td><td>" + (input.invoiceNumber ?? "—") + "</td></tr>",
    shipmentRows,
    "</table>",
    "<p class='signature'>Sincerely,<br/>Accounts Receivable Team<br/>Prepared automatically by Recovio</p>",
    "<p class='footer'>This dispute was generated from matched ERP, 3PL, and carrier records. Original evidence available upon request.</p>",
    "</div>",
    "</body>",
    "</html>"
  ].join("\n");
}
