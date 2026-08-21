"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { deductions, retailers } from "@/lib/demo-data";
import { formatCurrency, statusClass, statusLabel } from "@/lib/format";

const STATUS_OPTIONS = [
  "EXPIRING_SOON",
  "READY_TO_DISPUTE",
  "EVIDENCE_MISSING",
  "SUBMITTED",
  "WON",
  "LOST"
] as const;

const FAULT_OPTIONS = ["RETAILER", "THREE_PL", "CARRIER", "BRAND", "UNKNOWN"];

export default function DeductionsQueuePage() {
  const [retailerFilter, setRetailerFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [faultFilter, setFaultFilter] = useState("ALL");

  const filteredDeductions = useMemo(() => {
    return deductions.filter(deduction => {
      if (retailerFilter !== "ALL" && deduction.retailerId !== retailerFilter) {
        return false;
      }

      if (statusFilter !== "ALL" && deduction.status !== statusFilter) {
        return false;
      }

      if (faultFilter !== "ALL" && deduction.faultParty !== faultFilter) {
        return false;
      }

      return true;
    });
  }, [retailerFilter, statusFilter, faultFilter]);

  const totalValue = filteredDeductions.reduce(
    (sum, deduction) => sum + Math.abs(deduction.amount),
    0
  );

  const hasActiveFilters =
    retailerFilter !== "ALL" ||
    statusFilter !== "ALL" ||
    faultFilter !== "ALL";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Deductions Queue
        </h1>
        <p className="mt-1 text-slate-400">
          Every deduction across all retailers, filterable by team focus.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-400">
              Retailer
            </label>
            <select
              value={retailerFilter}
              onChange={event => setRetailerFilter(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm"
            >
              <option value="ALL">All retailers</option>
              {retailers.map(retailer => (
                <option key={retailer.id} value={retailer.id}>
                  {retailer.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-slate-400">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={event => setStatusFilter(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm"
            >
              <option value="ALL">All statuses</option>
              {STATUS_OPTIONS.map(status => (
                <option key={status} value={status}>
                  {statusLabel(status)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-slate-400">
              Fault Party
            </label>
            <select
              value={faultFilter}
              onChange={event => setFaultFilter(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm"
            >
              <option value="ALL">All fault parties</option>
              {FAULT_OPTIONS.map(fault => (
                <option key={fault} value={fault}>
                  {fault.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            {hasActiveFilters ? (
              <button
                onClick={() => {
                  setRetailerFilter("ALL");
                  setStatusFilter("ALL");
                  setFaultFilter("ALL");
                }}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium hover:bg-white/10"
              >
                Clear filters
              </button>
            ) : (
              <p className="text-sm text-slate-400">
                {filteredDeductions.length} deductions •{" "}
                {formatCurrency(totalValue)} total
              </p>
            )}
          </div>
        </div>
      </div>

      {filteredDeductions.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-10 text-center text-slate-400">
          No deductions match the current filters.
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-slate-900/60">
          <div className="border-b border-white/10 p-5">
            <h2 className="text-lg font-semibold">
              {filteredDeductions.length} deductions •{" "}
              {formatCurrency(totalValue)} at stake
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
                {filteredDeductions.map(deduction => {
                  const retailer = retailers.find(
                    item => item.id === deduction.retailerId
                  );

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
      )}
    </div>
  );
}
