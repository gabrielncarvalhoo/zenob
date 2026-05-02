-- Add IPTU tracking fields to Property model

ALTER TABLE "properties" ADD COLUMN "iptuStatus" VARCHAR(20) DEFAULT 'UNKNOWN';
ALTER TABLE "properties" ADD COLUMN "iptuLastChecked" TIMESTAMP;
ALTER TABLE "properties" ADD COLUMN "iptuDueDate" DATE;

CREATE INDEX "properties_iptuStatus_idx" ON "properties"("iptuStatus");