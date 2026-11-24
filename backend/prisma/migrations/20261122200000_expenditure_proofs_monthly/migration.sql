-- DropIndex
DROP INDEX "expenditures_proof_document_id_key";

-- AlterTable
ALTER TABLE "expenditures" ADD COLUMN     "description_en" TEXT,
ADD COLUMN     "proof_public" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "proof_document_id" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "expenditures_campaign_id_beneficiary_id_period_month_key" ON "expenditures"("campaign_id", "beneficiary_id", "period_month");

