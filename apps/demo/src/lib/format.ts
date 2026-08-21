import { DeductionStatus } from "@recovio/core";

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(Math.abs(value));
}

export function statusLabel(status: DeductionStatus): string {
  return status.replace(/_/g, " ");
}

export function statusClass(status: DeductionStatus): string {
  switch (status) {
    case "EXPIRING_SOON":
      return "border border-red-500/30 bg-red-500/15 text-red-300";
    case "READY_TO_DISPUTE":
      return "border border-emerald-500/30 bg-emerald-500/15 text-emerald-300";
    case "EVIDENCE_MISSING":
      return "border border-yellow-500/30 bg-yellow-500/15 text-yellow-300";
    case "SUBMITTED":
      return "border border-blue-500/30 bg-blue-500/15 text-blue-300";
    case "WON":
      return "border border-emerald-500/30 bg-emerald-500/15 text-emerald-300";
    case "LOST":
      return "border border-slate-500/30 bg-slate-500/15 text-slate-300";
    default:
      return "border border-slate-500/30 bg-slate-500/15 text-slate-300";
  }
}
