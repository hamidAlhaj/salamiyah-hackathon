-- CreateEnum
CREATE TYPE "BeneficiaryNoteKind" AS ENUM ('NOTE', 'VIOLATION', 'SUSPENDED', 'REACTIVATED');

-- CreateTable
CREATE TABLE "beneficiary_notes" (
    "id" UUID NOT NULL,
    "beneficiary_id" UUID NOT NULL,
    "kind" "BeneficiaryNoteKind" NOT NULL,
    "body" TEXT NOT NULL,
    "author_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "beneficiary_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "beneficiary_notes_beneficiary_id_created_at_idx" ON "beneficiary_notes"("beneficiary_id", "created_at");

-- AddForeignKey
ALTER TABLE "beneficiary_notes" ADD CONSTRAINT "beneficiary_notes_beneficiary_id_fkey" FOREIGN KEY ("beneficiary_id") REFERENCES "beneficiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiary_notes" ADD CONSTRAINT "beneficiary_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
