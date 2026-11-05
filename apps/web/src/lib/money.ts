import { Prisma } from "@prisma/client"

export function parseMoney(value: unknown): Prisma.Decimal | null {
  if (typeof value !== "string" && typeof value !== "number") return null
  if (typeof value === "number" && !Number.isFinite(value)) return null
  const text = String(value).trim()
  if (!/^-?\d+(?:\.\d{1,2})?$/.test(text)) return null
  try {
    return new Prisma.Decimal(text)
  } catch {
    return null
  }
}

export function formatMoney(
  value: Prisma.Decimal | number | string,
  currency = "USD"
): string {
  const amount = typeof value === "object" ? value.toFixed(2) : String(value)
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(amount)
  if (!match) throw new Error("Cannot format an invalid monetary value")
  const whole = BigInt(match[2])
  const cents = (match[3] ?? "").padEnd(2, "0")
  const wholeCurrency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(whole)
  return `${match[1]}${wholeCurrency}.${cents}`
}
