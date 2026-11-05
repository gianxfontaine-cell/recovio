import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SyncButton } from "@/components/sync-button";
import { CarrierSync } from "@/components/carrier-sync";
import { EdiSync } from "@/components/edi-sync";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { isDemoMode } from "@/lib/mode";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { tenant: true }
  });

  if (!user?.tenant) {
    redirect("/onboarding");
  }

  const deductionCount = await prisma.deduction.count({
    where: { tenantId: user.tenant.id }
  });

  const invoiceCount = await prisma.invoice.count({
    where: { tenantId: user.tenant.id }
  });

  const shipmentCount = await prisma.shipment.count({
    where: { tenantId: user.tenant.id }
  });

  const podCount = await prisma.shipment.count({
    where: { tenantId: user.tenant.id, podSigned: true }
  });

  const [backChargeCount, backChargeTotal] = await Promise.all([
    prisma.backCharge.count({ where: { tenantId: user.tenant.id } }),
    prisma.backCharge.aggregate({
      where: { tenantId: user.tenant.id },
      _sum: { amount: true }
    })
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            {user.tenant.name}
          </h1>
          <p className="mt-2 text-lg text-slate-400">
            Welcome back, {user.name || user.email}
          </p>
        </div>

        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10">
            Sign Out
          </button>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-300">
            Authentication
          </h2>
          <div className="mt-3 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-lg font-medium text-emerald-300">
              Signed in securely
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Workspace Data
          </h2>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Invoices synced</span>
              <span className="font-mono font-semibold">{invoiceCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Shipments tracked</span>
              <span className="font-mono font-semibold">{shipmentCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">PODs retrieved</span>
              <span className="font-mono font-semibold text-emerald-400">
                {podCount}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Deductions</span>
              <span className="font-mono font-semibold">{deductionCount}</span>
            </div>
          </div>
        </div>

        {["ADMIN", "OPERATIONS"].includes(user.role) ? <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-blue-300">
            NetSuite Integration
          </h2>
          <p className="mt-2 text-xs text-blue-300/80">
            Pull invoices from your ERP into this workspace.
          </p>
          <SyncButton />
        </div> : null}

        {["ADMIN", "OPERATIONS"].includes(user.role) ? <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-violet-300">
            Carrier Integration
          </h2>
          <p className="mt-2 text-xs text-violet-300/80">
            Match shipments from your 3PL, then auto-retrieve Proof of
            Delivery from carriers.
          </p>
          <CarrierSync demoMode={isDemoMode()} />
        </div> : null}

        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 md:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-rose-300">
              Deduction Feed
            </h2>
            <Link
              href="/deductions"
              className="text-sm text-rose-300 underline underline-offset-2 hover:text-rose-200"
            >
              View all deductions →
            </Link>
          </div>
          <p className="mt-2 text-xs text-rose-300/80">
            Ingest retailer chargebacks, auto-match to invoices and
            shipments, score evidence, and assign fault.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="mt-4 flex gap-6 text-sm">
              <div>
                <span className="text-slate-400">Total: </span>
                <span className="font-mono font-semibold">{deductionCount}</span>
              </div>
            </div>
            {["ADMIN", "OPERATIONS"].includes(user.role) ? <EdiSync demoMode={isDemoMode()} /> : null}
          </div>
        </div>

        <Link
          href="/onboarding"
          className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-6 transition-colors hover:bg-sky-500/15 md:col-span-2"
        >
          <h2 className="text-sm font-semibold uppercase tracking-wider text-sky-300">
            Organization onboarding
          </h2>
          <p className="mt-2 text-sm text-sky-100/70">
            Manage teammates, setup progress, and customer integrations.
          </p>
        </Link>

        <Link
          href="/back-charges"
          className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 transition-colors hover:bg-amber-500/15 md:col-span-2"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-300">
                3PL Back-charges
              </h2>
              <p className="mt-2 text-sm text-amber-100/70">
                Review draft debit memos for deductions attributed to logistics partners.
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold">
                {formatMoney(backChargeTotal._sum.amount ?? 0)}
              </p>
              <p className="text-xs text-amber-200/70">
                {backChargeCount} memo{backChargeCount === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
