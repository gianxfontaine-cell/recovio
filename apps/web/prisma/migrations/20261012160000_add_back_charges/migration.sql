CREATE TABLE "BackCharge" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "deductionId" TEXT NOT NULL,
    "memoNumber" TEXT NOT NULL,
    "thirdPartyLogistics" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "memoHtml" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackCharge_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BackCharge_deductionId_key" ON "BackCharge"("deductionId");
CREATE UNIQUE INDEX "BackCharge_tenantId_memoNumber_key" ON "BackCharge"("tenantId", "memoNumber");
CREATE INDEX "BackCharge_tenantId_status_createdAt_idx" ON "BackCharge"("tenantId", "status", "createdAt");

ALTER TABLE "BackCharge" ADD CONSTRAINT "BackCharge_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BackCharge" ADD CONSTRAINT "BackCharge_deductionId_fkey"
    FOREIGN KEY ("deductionId") REFERENCES "Deduction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
