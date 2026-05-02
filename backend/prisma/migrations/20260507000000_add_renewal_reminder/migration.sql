-- RenewalReminder model: tracks scheduled renewal notifications per contract

CREATE TABLE "renewal_reminders" (
  "id" VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR(36),
  "leaseContractId" VARCHAR(36) NOT NULL,
  "scheduledFor" DATE NOT NULL,
  "daysBeforeExpiry" INT NOT NULL,
  "status" VARCHAR(20) DEFAULT 'PENDING', -- PENDING, SENT, CANCELLED
  "notificationId" VARCHAR(36),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY ("leaseContractId") REFERENCES "lease_contracts"("id")
);

CREATE INDEX "renewal_reminders_contractId_idx" ON "renewal_reminders"("leaseContractId");
CREATE INDEX "renewal_reminders_scheduledFor_idx" ON "renewal_reminders"("scheduledFor");
CREATE INDEX "renewal_reminders_status_idx" ON "renewal_reminders"("status");