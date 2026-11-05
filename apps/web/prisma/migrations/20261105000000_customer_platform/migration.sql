ALTER TABLE "Deduction"
  ALTER COLUMN "amount" TYPE DECIMAL(18,2)
  USING ROUND("amount"::numeric, 2);

ALTER TABLE "BackCharge"
  ALTER COLUMN "amount" TYPE DECIMAL(18,2)
  USING ROUND("amount"::numeric, 2);

ALTER TABLE "Invoice"
  ALTER COLUMN "totalAmount" TYPE DECIMAL(18,2)
  USING ROUND("totalAmount"::numeric, 2);

ALTER TABLE "Dispute"
  ALTER COLUMN "requestedAmount" TYPE DECIMAL(18,2)
  USING ROUND("requestedAmount"::numeric, 2);

ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'VIEWER';
WITH ranked_legacy_members AS (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "tenantId" ORDER BY "createdAt", "id") AS position
  FROM "User"
  WHERE "tenantId" IS NOT NULL AND "role" = 'member'
)
UPDATE "User" AS users
SET "role" = CASE WHEN ranked.position = 1 THEN 'ADMIN' ELSE 'VIEWER' END
FROM ranked_legacy_members AS ranked
WHERE users."id" = ranked."id";
ALTER TABLE "Dispute" ADD COLUMN "requestedById" TEXT;
ALTER TABLE "Dispute" ADD COLUMN "reviewedById" TEXT;
ALTER TABLE "Dispute" ADD COLUMN "reviewedAt" TIMESTAMP(3);
ALTER TABLE "Dispute" ADD COLUMN "reviewNotes" TEXT;
UPDATE "Dispute" SET "status" = 'PENDING_REVIEW' WHERE "status" = 'GENERATED';

CREATE TABLE "Invitation" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IntegrationCredential" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "encryptedCredentials" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'CONFIGURED',
  "lastCheckedAt" TIMESTAMP(3),
  "lastError" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "IntegrationCredential_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditEvent" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "resourceType" TEXT NOT NULL,
  "resourceId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Invitation_tokenHash_key" ON "Invitation"("tokenHash");
CREATE INDEX "Invitation_tenantId_email_acceptedAt_idx" ON "Invitation"("tenantId", "email", "acceptedAt");
CREATE UNIQUE INDEX "IntegrationCredential_tenantId_provider_key" ON "IntegrationCredential"("tenantId", "provider");
CREATE INDEX "IntegrationCredential_tenantId_status_idx" ON "IntegrationCredential"("tenantId", "status");
CREATE INDEX "AuditEvent_tenantId_createdAt_idx" ON "AuditEvent"("tenantId", "createdAt");
CREATE INDEX "AuditEvent_actorId_createdAt_idx" ON "AuditEvent"("actorId", "createdAt");
CREATE UNIQUE INDEX "Retailer_tenantId_id_key" ON "Retailer"("tenantId", "id");
CREATE UNIQUE INDEX "User_tenantId_id_key" ON "User"("tenantId", "id");
CREATE UNIQUE INDEX "Deduction_tenantId_id_key" ON "Deduction"("tenantId", "id");
CREATE UNIQUE INDEX "Shipment_tenantId_id_key" ON "Shipment"("tenantId", "id");
CREATE UNIQUE INDEX "BackCharge_tenantId_deductionId_key" ON "BackCharge"("tenantId", "deductionId");
CREATE UNIQUE INDEX "Dispute_tenantId_deductionId_key" ON "Dispute"("tenantId", "deductionId");

ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IntegrationCredential" ADD CONSTRAINT "IntegrationCredential_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_tenantId_createdById_fkey"
  FOREIGN KEY ("tenantId", "createdById") REFERENCES "User"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_tenantId_actorId_fkey"
  FOREIGN KEY ("tenantId", "actorId") REFERENCES "User"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Deduction" DROP CONSTRAINT IF EXISTS "Deduction_retailerId_fkey";
ALTER TABLE "Deduction" DROP CONSTRAINT IF EXISTS "Deduction_shipmentId_fkey";
ALTER TABLE "BackCharge" DROP CONSTRAINT IF EXISTS "BackCharge_deductionId_fkey";

ALTER TABLE "Deduction" ADD CONSTRAINT "Deduction_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Deduction" ADD CONSTRAINT "Deduction_tenantId_retailerId_fkey"
  FOREIGN KEY ("tenantId", "retailerId") REFERENCES "Retailer"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Deduction" ADD CONSTRAINT "Deduction_tenantId_shipmentId_fkey"
  FOREIGN KEY ("tenantId", "shipmentId") REFERENCES "Shipment"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BackCharge" ADD CONSTRAINT "BackCharge_tenantId_deductionId_fkey"
  FOREIGN KEY ("tenantId", "deductionId") REFERENCES "Deduction"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_tenantId_deductionId_fkey"
  FOREIGN KEY ("tenantId", "deductionId") REFERENCES "Deduction"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EvidenceRecord" ADD CONSTRAINT "EvidenceRecord_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EvidenceRecord" ADD CONSTRAINT "EvidenceRecord_tenantId_deductionId_fkey"
  FOREIGN KEY ("tenantId", "deductionId") REFERENCES "Deduction"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
