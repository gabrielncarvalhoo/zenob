-- Renomeia BUILDING para COMPLEX preservando dados existentes
ALTER TYPE "PropertyType" RENAME VALUE 'BUILDING' TO 'COMPLEX';

-- Adiciona campos de registro (IPTU, água, energia) à unidade
ALTER TABLE "units" ADD COLUMN "iptuCode" TEXT;
ALTER TABLE "units" ADD COLUMN "waterRegistration" TEXT;
ALTER TABLE "units" ADD COLUMN "energyRegistration" TEXT;
