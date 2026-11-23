-- AlterTable
ALTER TABLE "campaign_categories" ADD COLUMN     "beneficiary_kind" "BeneficiaryKind";

-- AlterTable
ALTER TABLE "cases" ADD COLUMN     "overdue_notified_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "donor_code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_donor_code_key" ON "users"("donor_code");

