import { Prisma, PrismaClient } from "@prisma/client"
import { formatMoney } from "./money"

type BackChargeInput = {
  memoNumber: string
  thirdPartyLogistics: string
  amount: Prisma.Decimal
  deduction: {
    externalId: string
    reasonDescription: string | null
    reasonCode: string
    invoiceNumber: string | null
    poNumber: string | null
    deductionDate: Date
    evidenceScore: number
    retailer: { name: string }
    shipment: {
      proNumber: string | null
      bolNumber: string | null
      carrierName: string | null
    } | null
  }
  workspaceName: string
}

type EligibleDeduction = Prisma.DeductionGetPayload<{
  include: {
    retailer: { select: { name: true } }
    shipment: {
      select: {
        thirdPartyLogistics: true
        proNumber: true
        bolNumber: true
        carrierName: true
      }
    }
  }
}>

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }
    return entities[character]
  })
}

export function createBackChargeMemoNumber(
  externalId: string,
  deductionId: string,
  deductionDate: Date
): string {
  const year = deductionDate.getUTCFullYear()
  const reference = externalId.replace(/[^a-zA-Z0-9-]/g, "-")
  return `BC-${year}-${reference}-${deductionId.slice(-6).toUpperCase()}`
}

export function buildBackChargeMemoHtml(input: BackChargeInput): string {
  const { deduction } = input
  const details = [
    ["Memo number", input.memoNumber],
    ["Workspace", input.workspaceName],
    ["3PL", input.thirdPartyLogistics],
    ["Retailer", deduction.retailer.name],
    ["Retailer deduction", deduction.externalId],
    ["Reason", deduction.reasonDescription ?? deduction.reasonCode],
    ["Invoice", deduction.invoiceNumber ?? "Not provided"],
    ["PO", deduction.poNumber ?? "Not provided"],
    ["PRO", deduction.shipment?.proNumber ?? "Not provided"],
    ["BOL", deduction.shipment?.bolNumber ?? "Not provided"],
    ["Carrier", deduction.shipment?.carrierName ?? "Not provided"],
    ["Deduction date", deduction.deductionDate.toISOString().slice(0, 10)],
    ["Evidence score", `${deduction.evidenceScore}/100`]
  ]

  const rows = details
    .map(
      ([label, value]) =>
        `<tr><th scope="row">${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`
    )
    .join("\n")
  const amount = formatMoney(input.amount)

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Draft debit memo ${escapeHtml(input.memoNumber)}</title>
  <style>
    body{font:15px/1.5 Arial,Helvetica,sans-serif;color:#172033;margin:0;padding:32px;background:#f1f5f9}
    main{max-width:760px;margin:auto;background:#fff;padding:40px;border:1px solid #cbd5e1}
    header{display:flex;justify-content:space-between;border-bottom:2px solid #172033;padding-bottom:16px}
    h1{font-size:24px;margin:28px 0 4px}.status{color:#92400e;background:#fef3c7;padding:5px 10px;border-radius:999px;font-size:12px;font-weight:bold}
    table{width:100%;border-collapse:collapse;margin:24px 0}th,td{text-align:left;padding:10px;border-bottom:1px solid #e2e8f0}th{width:34%;color:#64748b;font-weight:500}
    .amount{font-size:24px;font-weight:bold}.notice{margin-top:28px;padding:14px;background:#fff7ed;border-left:4px solid #f97316}
    @media print{body{padding:0;background:#fff}main{border:0}}
  </style>
</head>
<body>
  <main>
    <header><strong>${escapeHtml(input.workspaceName)}</strong><span class="status">DRAFT — NOT ISSUED</span></header>
    <h1>3PL Debit Memo</h1>
    <p>Request for reimbursement of a retailer deduction attributed to 3PL handling.</p>
    <p class="amount">${escapeHtml(amount)}</p>
    <table><tbody>${rows}</tbody></table>
    <div class="notice">This is a draft for review. It has not been issued, transmitted, or posted to an accounting system.</div>
  </main>
</body>
</html>`
}

export async function ensureDraftBackCharge(
  db: PrismaClient,
  input: {
    tenantId: string
    workspaceName: string
    deduction: EligibleDeduction
  }
) {
  const { deduction } = input
  const thirdPartyLogistics = deduction.shipment?.thirdPartyLogistics?.trim()
  if (deduction.faultParty !== "THREE_PL" || !deduction.amount.isNegative() || !thirdPartyLogistics) {
    return { backCharge: null, created: false, refreshed: false }
  }

  const memoNumber = createBackChargeMemoNumber(
    deduction.externalId,
    deduction.id,
    deduction.deductionDate
  )
  const memoHtml = buildBackChargeMemoHtml({
    memoNumber,
    thirdPartyLogistics,
    amount: deduction.amount.abs(),
    deduction,
    workspaceName: input.workspaceName
  })
  const existing = await db.backCharge.findUnique({
    where: { deductionId: deduction.id }
  })

  if (existing) {
    if (existing.status !== "DRAFT") {
      return { backCharge: existing, created: false, refreshed: false }
    }

    const backCharge = await db.backCharge.update({
      where: { id: existing.id },
      data: {
        thirdPartyLogistics,
        amount: deduction.amount.abs(),
        memoHtml
      }
    })
    return { backCharge, created: false, refreshed: true }
  }

  try {
    const backCharge = await db.backCharge.create({
      data: {
        tenantId: input.tenantId,
        deductionId: deduction.id,
        memoNumber,
        thirdPartyLogistics,
        amount: deduction.amount.abs(),
        memoHtml
      }
    })
    return { backCharge, created: true, refreshed: false }
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const backCharge = await db.backCharge.findUnique({
        where: { deductionId: deduction.id }
      })
      if (backCharge) {
        return { backCharge, created: false, refreshed: false }
      }
    }
    throw error
  }
}
