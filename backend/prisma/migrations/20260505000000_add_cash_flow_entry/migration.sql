-- Add CashFlowEntry model for manual bank reconciliation tracking
-- Reconcile: tenant + competency → expected vs registered payments

CREATE TABLE "cash_flow_entries" (
  "id" VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid():: VARCHAR(36),
  "accountId" VARCHAR(36) NOT NULL,
  "tenantId" VARCHAR(36) NOT NULL,
  "leaseContractId" VARCHAR(36) NOT NULL,
  "competencyMonth" VARCHAR(7) NOT NULL, -- "2026-05"
  "amount" DECIMAL(12,2) NOT NULL,
  "paymentMethod" VARCHAR(20) NOT NULL, -- PIX, CASH, CHECK
  "transactionDate" DATE NOT NULL,
  "matchedReceivableId" VARCHAR(36),
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id"),
  FOREIGN KEY ("leaseContractId") REFERENCES "lease_contracts"("id"),
  FOREIGN KEY ("matchedReceivableId") REFERENCES "receivables"("id")
);

CREATE INDEX "cash_flow_entries_accountId_idx" ON "cash_flow_entries"("accountId");
CREATE INDEX "cash_flow_entries_tenantId_idx" ON "cash_flow_entries"("tenantId");
CREATE INDEX "cash_flow_entries_competencyMonth_idx" ON "cash_flow_entries"("competencyMonth");