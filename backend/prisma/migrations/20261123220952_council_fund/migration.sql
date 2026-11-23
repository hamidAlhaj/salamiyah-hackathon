-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "is_general_fund" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "pledges" ADD COLUMN     "fund_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "held_amount" DECIMAL(14,2) NOT NULL DEFAULT 0;
