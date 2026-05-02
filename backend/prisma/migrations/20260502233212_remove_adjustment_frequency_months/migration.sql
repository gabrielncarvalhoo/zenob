-- Remove campo adjustmentFrequencyMonths (vigência já vem de startDate/endDate)
ALTER TABLE "lease_contracts" DROP COLUMN "adjustmentFrequencyMonths";
