-- ContractTemplate model for user-uploaded PDF contract templates with placeholder replacement

CREATE TABLE "contract_templates" (
  "id" VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR(36),
  "accountId" VARCHAR(36) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "templateUrl" TEXT NOT NULL,
  "isActive" BOOLEAN DEFAULT TRUE,
  "placeholders" JSONB DEFAULT '[]',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY ("accountId") REFERENCES "accounts"("id")
);

CREATE INDEX "contract_templates_accountId_idx" ON "contract_templates"("accountId");
CREATE INDEX "contract_templates_isActive_idx" ON "contract_templates"("isActive");