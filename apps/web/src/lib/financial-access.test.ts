import assert from "node:assert/strict"
import { test } from "node:test"
import { canReviewDispute, hasTenantRole, tenantScope } from "./access-policy"
import { formatMoney, parseMoney } from "./money"
import { evaluateDeduction } from "../../../../packages/core/src/matching"
import { buildDisputeLetterHtml } from "../../../../packages/core/src/dispute-letter"
import { decryptCredentials, encryptCredentials } from "./credentials"
import { isDemoMode } from "./mode"

test("role policy permits only the explicitly granted organization roles", () => {
  assert.equal(hasTenantRole("ADMIN", ["ADMIN", "FINANCE"]), true)
  assert.equal(hasTenantRole("FINANCE", ["ADMIN", "FINANCE"]), true)
  assert.equal(hasTenantRole("OPERATIONS", ["ADMIN", "FINANCE"]), false)
  assert.equal(hasTenantRole("VIEWER", ["ADMIN", "FINANCE"]), false)
  assert.equal(hasTenantRole("member", ["ADMIN"]), false)
})

test("tenant scope cannot be overridden by a resource filter", () => {
  assert.deepEqual(tenantScope("tenant-a", { id: "row-1", tenantId: "tenant-b" }), {
    id: "row-1",
    tenantId: "tenant-a"
  })
})

test("dispute decisions require a different reviewer and pending status", () => {
  assert.equal(canReviewDispute("PENDING_REVIEW", "requester", "reviewer"), true)
  assert.equal(canReviewDispute("PENDING_REVIEW", "same-user", "same-user"), false)
  assert.equal(canReviewDispute("APPROVED", "requester", "reviewer"), false)
})

test("money parsing preserves cents and rejects values with excess precision", () => {
  const first = parseMoney("0.10")
  const second = parseMoney("0.20")
  assert.ok(first)
  assert.ok(second)
  assert.equal(first.plus(second).toFixed(2), "0.30")
  assert.equal(parseMoney("-1850.25")?.toFixed(2), "-1850.25")
  assert.equal(parseMoney("1.005"), null)
  assert.equal(parseMoney(Number.NaN), null)
  assert.equal(formatMoney(parseMoney("0.30")!), "$0.30")
  assert.equal(formatMoney(parseMoney("9007199254740993.01")!), "$9,007,199,254,740,993.01")
})

test("representative deduction outcomes remain deterministic", () => {
  const ready = evaluateDeduction({
    reasonCode: "SHORTAGE",
    hasInvoice: true,
    hasShipment: true,
    podSigned: true
  })
  assert.equal(ready.evidenceScore, 65)
  assert.equal(ready.faultParty, "RETAILER")
  assert.equal(ready.status, "READY_TO_DISPUTE")

  const missingEvidence = evaluateDeduction({
    reasonCode: "SHORTAGE",
    hasInvoice: true,
    hasShipment: true,
    podSigned: false
  })
  assert.equal(missingEvidence.status, "EVIDENCE_MISSING")
})

test("dispute letters render cents exactly and escape customer-controlled text", () => {
  const html = buildDisputeLetterHtml({
    retailerName: "<Retailer>",
    externalId: "D-1",
    amount: "9007199254740993.01",
    reasonDescription: "Shortage",
    invoiceNumber: "INV-1",
    poNumber: null,
    proNumber: null,
    bolNumber: null,
    carrierName: null,
    podSigned: false,
    faultParty: "RETAILER"
  })
  assert.match(html, /\$9,007,199,254,740,993\.01/)
  assert.match(html, /&lt;Retailer&gt;/)
})

test("integration credentials are encrypted and bound to the tenant/provider context", () => {
  const previousKey = process.env.INTEGRATION_ENCRYPTION_KEY
  process.env.INTEGRATION_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64")
  try {
    const encrypted = encryptCredentials({ apiKey: "test-secret-value" }, "tenant-a:xpo")
    assert.equal(encrypted.includes("test-secret-value"), false)
    assert.deepEqual(decryptCredentials(encrypted, "tenant-a:xpo"), { apiKey: "test-secret-value" })
    assert.throws(() => decryptCredentials(encrypted, "tenant-b:xpo"))
  } finally {
    if (previousKey === undefined) delete process.env.INTEGRATION_ENCRYPTION_KEY
    else process.env.INTEGRATION_ENCRYPTION_KEY = previousKey
  }
})

test("demo fixtures cannot be enabled in production", () => {
  assert.equal(isDemoMode("demo", "development"), true)
  assert.equal(isDemoMode("demo", "production"), false)
  assert.equal(isDemoMode("production", "development"), false)
})
