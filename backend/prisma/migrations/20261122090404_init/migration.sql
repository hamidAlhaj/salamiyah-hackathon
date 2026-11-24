-- CreateEnum
CREATE TYPE "Role" AS ENUM ('DONOR', 'CASE_OFFICER', 'FINANCE_VERIFIER', 'STAFF', 'ADMIN', 'COLLECTOR');

-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('ar', 'en');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('SYP', 'USD');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'FUNDED', 'COMPLETED', 'CLOSED');

-- CreateEnum
CREATE TYPE "CaseCategory" AS ENUM ('SURGERY', 'MEDICATION', 'INCUBATOR', 'ONCOLOGY', 'TRANSPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'NEEDS_INFO', 'APPROVED', 'REJECTED', 'PUBLISHED', 'CLOSED');

-- CreateEnum
CREATE TYPE "CaseRoute" AS ENUM ('CROWDFUNDING', 'AGA_KHAN_REFERRAL', 'MONTHLY_BUDGET');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('VERY_URGENT', 'URGENT', 'NORMAL');

-- CreateEnum
CREATE TYPE "DocumentKind" AS ENUM ('MEDICAL_REPORT', 'ID_DOCUMENT', 'HOSPITAL_QUOTE', 'EXPENDITURE_PROOF', 'OTHER');

-- CreateEnum
CREATE TYPE "CollectionPointType" AS ENUM ('MOSQUE', 'CENTER', 'OFFICE', 'SHOP', 'OTHER');

-- CreateEnum
CREATE TYPE "PledgeChannel" AS ENUM ('PLATFORM', 'COUNCIL', 'COLLECTOR');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('BEMO_TRANSFER', 'BANK_TRANSFER', 'SHAM_CASH', 'SYRIATEL_CASH', 'MTN_CASH', 'PAYPAL', 'VISA', 'CASH');

-- CreateEnum
CREATE TYPE "PaymentMethodKind" AS ENUM ('TRANSFER', 'WALLET', 'CARD', 'CASH');

-- CreateEnum
CREATE TYPE "PledgeStatus" AS ENUM ('PLEDGED', 'RECEIPT_UPLOADED', 'COLLECTED', 'VERIFIED', 'DEMO_CONFIRMED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ImportKind" AS ENUM ('BENEFICIARIES');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('PREVIEW', 'COMMITTED', 'FAILED');

-- CreateEnum
CREATE TYPE "BeneficiaryKind" AS ENUM ('PATIENT', 'ORPHAN', 'FAMILY', 'OTHER');

-- CreateEnum
CREATE TYPE "PayeeType" AS ENUM ('HOSPITAL', 'CONTRACTOR', 'SUPPLIER', 'BENEFICIARY_FAMILY', 'OTHER');

-- CreateEnum
CREATE TYPE "MessageChannel" AS ENUM ('WHATSAPP');

-- CreateEnum
CREATE TYPE "OutboundStatus" AS ENUM ('QUEUED', 'OPENED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "password_hash" TEXT,
    "role" "Role" NOT NULL DEFAULT 'DONOR',
    "locale" "Locale" NOT NULL DEFAULT 'ar',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "local_council" TEXT,
    "whatsapp_opt_in" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beneficiaries" (
    "id" UUID NOT NULL,
    "public_code" TEXT NOT NULL,
    "kind" "BeneficiaryKind" NOT NULL DEFAULT 'OTHER',
    "area" TEXT,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "national_id_hash" TEXT,
    "national_id_last4" TEXT,
    "local_council" TEXT,
    "other_programs" TEXT[],
    "is_suspended" BOOLEAN NOT NULL DEFAULT false,
    "suspension_note" TEXT,
    "import_job_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beneficiaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hospitals" (
    "id" UUID NOT NULL,
    "name_ar" TEXT NOT NULL,
    "name_en" TEXT,
    "city" TEXT NOT NULL,
    "is_private" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "hospitals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cases" (
    "id" UUID NOT NULL,
    "tracking_no" TEXT NOT NULL,
    "beneficiary_id" UUID NOT NULL,
    "category" "CaseCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "requested_amount" DECIMAL(14,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'SYP',
    "status" "CaseStatus" NOT NULL DEFAULT 'SUBMITTED',
    "priority" "Priority",
    "route" "CaseRoute",
    "hospital_id" UUID,
    "doctor_name" TEXT,
    "approved_amount" DECIMAL(14,2),
    "is_anonymous" BOOLEAN NOT NULL DEFAULT true,
    "redacted_summary" TEXT,
    "rejection_reason" TEXT,
    "submitted_by_id" UUID NOT NULL,
    "reviewed_by_id" UUID,
    "reviewed_at" TIMESTAMP(3),
    "sla_due_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_categories" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "description_ar" TEXT,
    "description_en" TEXT,
    "icon" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "requires_medical_case" BOOLEAN NOT NULL DEFAULT false,
    "locked_payee_hospital" BOOLEAN NOT NULL DEFAULT false,
    "supports_monthly_sponsorship" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "category_id" UUID NOT NULL,
    "case_id" UUID,
    "is_ongoing" BOOLEAN NOT NULL DEFAULT false,
    "title_ar" TEXT NOT NULL,
    "title_en" TEXT,
    "summary_ar" TEXT NOT NULL,
    "summary_en" TEXT,
    "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
    "target_amount" DECIMAL(14,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'SYP',
    "hospital_id" UUID,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "accepts_pledges" BOOLEAN NOT NULL DEFAULT true,
    "verified_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "spent_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "cover_key" TEXT,
    "area" TEXT,
    "published_at" TIMESTAMP(3),
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL,
    "kind" "DocumentKind" NOT NULL,
    "case_id" UUID,
    "storage_key" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "uploaded_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_points" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CollectionPointType" NOT NULL DEFAULT 'OTHER',
    "contact_name" TEXT,
    "area" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pledges" (
    "id" UUID NOT NULL,
    "reference_no" TEXT NOT NULL,
    "campaign_id" UUID NOT NULL,
    "donor_id" UUID,
    "donor_name" TEXT,
    "donor_phone" TEXT,
    "is_anonymous_display" BOOLEAN NOT NULL DEFAULT false,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" "Currency" NOT NULL,
    "channel" "PledgeChannel" NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PledgeStatus" NOT NULL,
    "is_demo" BOOLEAN NOT NULL DEFAULT false,
    "collection_point_id" UUID,
    "recorded_by_id" UUID,
    "official_receipt_no" TEXT,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pledges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipts" (
    "id" UUID NOT NULL,
    "pledge_id" UUID NOT NULL,
    "storage_key" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "transfer_ref" TEXT,
    "uploaded_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" UUID NOT NULL,
    "pledge_id" UUID NOT NULL,
    "receipt_id" UUID,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewer_id" UUID,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decided_at" TIMESTAMP(3),

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenditures" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "payee_type" "PayeeType" NOT NULL,
    "payee_label" TEXT NOT NULL,
    "hospital_id" UUID,
    "beneficiary_id" UUID,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" "Currency" NOT NULL,
    "description" TEXT NOT NULL,
    "paid_at" TIMESTAMP(3) NOT NULL,
    "period_month" TEXT,
    "proof_document_id" UUID NOT NULL,
    "recorded_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expenditures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_updates" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "body_ar" TEXT NOT NULL,
    "body_en" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_jobs" (
    "id" UUID NOT NULL,
    "kind" "ImportKind" NOT NULL,
    "status" "ImportStatus" NOT NULL DEFAULT 'PREVIEW',
    "file_name" TEXT NOT NULL,
    "storage_key" TEXT,
    "mapping" JSONB,
    "total_rows" INTEGER NOT NULL DEFAULT 0,
    "valid_rows" INTEGER NOT NULL DEFAULT 0,
    "error_rows" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "committed_at" TIMESTAMP(3),

    CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "link" TEXT,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_beneficiaries" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "beneficiary_id" UUID NOT NULL,
    "monthly_amount" DECIMAL(14,2),
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),

    CONSTRAINT "campaign_beneficiaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_method_configs" (
    "id" UUID NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "kind" "PaymentMethodKind" NOT NULL,
    "label_ar" TEXT NOT NULL,
    "label_en" TEXT NOT NULL,
    "account_name" TEXT,
    "account_number" TEXT,
    "instructions_ar" TEXT,
    "instructions_en" TEXT,
    "allows_receipt_upload" BOOLEAN NOT NULL DEFAULT false,
    "allows_demo_checkout" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_method_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_payment_accounts" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "account_name" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "note" TEXT,

    CONSTRAINT "campaign_payment_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbound_messages" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "phone" TEXT NOT NULL,
    "channel" "MessageChannel" NOT NULL DEFAULT 'WHATSAPP',
    "template" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "link" TEXT,
    "status" "OutboundStatus" NOT NULL DEFAULT 'QUEUED',
    "related_type" TEXT,
    "related_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "opened_at" TIMESTAMP(3),

    CONSTRAINT "outbound_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CollectorPoints" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "beneficiaries_public_code_key" ON "beneficiaries"("public_code");

-- CreateIndex
CREATE INDEX "beneficiaries_national_id_hash_idx" ON "beneficiaries"("national_id_hash");

-- CreateIndex
CREATE INDEX "beneficiaries_phone_idx" ON "beneficiaries"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "cases_tracking_no_key" ON "cases"("tracking_no");

-- CreateIndex
CREATE INDEX "cases_status_priority_idx" ON "cases"("status", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_categories_code_key" ON "campaign_categories"("code");

-- CreateIndex
CREATE INDEX "campaign_categories_is_active_sort_order_idx" ON "campaign_categories"("is_active", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_slug_key" ON "campaigns"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_case_id_key" ON "campaigns"("case_id");

-- CreateIndex
CREATE INDEX "campaigns_status_category_id_priority_idx" ON "campaigns"("status", "category_id", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "documents_storage_key_key" ON "documents"("storage_key");

-- CreateIndex
CREATE UNIQUE INDEX "pledges_reference_no_key" ON "pledges"("reference_no");

-- CreateIndex
CREATE UNIQUE INDEX "pledges_official_receipt_no_key" ON "pledges"("official_receipt_no");

-- CreateIndex
CREATE INDEX "pledges_campaign_id_status_idx" ON "pledges"("campaign_id", "status");

-- CreateIndex
CREATE INDEX "pledges_donor_id_idx" ON "pledges"("donor_id");

-- CreateIndex
CREATE UNIQUE INDEX "receipts_storage_key_key" ON "receipts"("storage_key");

-- CreateIndex
CREATE INDEX "receipts_sha256_idx" ON "receipts"("sha256");

-- CreateIndex
CREATE INDEX "verifications_status_created_at_idx" ON "verifications"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "expenditures_proof_document_id_key" ON "expenditures"("proof_document_id");

-- CreateIndex
CREATE INDEX "expenditures_campaign_id_paid_at_idx" ON "expenditures"("campaign_id", "paid_at");

-- CreateIndex
CREATE INDEX "expenditures_beneficiary_id_period_month_idx" ON "expenditures"("beneficiary_id", "period_month");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_beneficiaries_campaign_id_beneficiary_id_key" ON "campaign_beneficiaries"("campaign_id", "beneficiary_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_method_configs_method_key" ON "payment_method_configs"("method");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_payment_accounts_campaign_id_method_key" ON "campaign_payment_accounts"("campaign_id", "method");

-- CreateIndex
CREATE INDEX "outbound_messages_status_created_at_idx" ON "outbound_messages"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "_CollectorPoints_AB_unique" ON "_CollectorPoints"("A", "B");

-- CreateIndex
CREATE INDEX "_CollectorPoints_B_index" ON "_CollectorPoints"("B");

-- AddForeignKey
ALTER TABLE "beneficiaries" ADD CONSTRAINT "beneficiaries_import_job_id_fkey" FOREIGN KEY ("import_job_id") REFERENCES "import_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_beneficiary_id_fkey" FOREIGN KEY ("beneficiary_id") REFERENCES "beneficiaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_submitted_by_id_fkey" FOREIGN KEY ("submitted_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "campaign_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pledges" ADD CONSTRAINT "pledges_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pledges" ADD CONSTRAINT "pledges_donor_id_fkey" FOREIGN KEY ("donor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pledges" ADD CONSTRAINT "pledges_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pledges" ADD CONSTRAINT "pledges_collection_point_id_fkey" FOREIGN KEY ("collection_point_id") REFERENCES "collection_points"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_pledge_id_fkey" FOREIGN KEY ("pledge_id") REFERENCES "pledges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_pledge_id_fkey" FOREIGN KEY ("pledge_id") REFERENCES "pledges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "receipts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenditures" ADD CONSTRAINT "expenditures_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenditures" ADD CONSTRAINT "expenditures_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenditures" ADD CONSTRAINT "expenditures_beneficiary_id_fkey" FOREIGN KEY ("beneficiary_id") REFERENCES "beneficiaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenditures" ADD CONSTRAINT "expenditures_proof_document_id_fkey" FOREIGN KEY ("proof_document_id") REFERENCES "documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenditures" ADD CONSTRAINT "expenditures_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_updates" ADD CONSTRAINT "campaign_updates_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_updates" ADD CONSTRAINT "campaign_updates_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_beneficiaries" ADD CONSTRAINT "campaign_beneficiaries_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_beneficiaries" ADD CONSTRAINT "campaign_beneficiaries_beneficiary_id_fkey" FOREIGN KEY ("beneficiary_id") REFERENCES "beneficiaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_payment_accounts" ADD CONSTRAINT "campaign_payment_accounts_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outbound_messages" ADD CONSTRAINT "outbound_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CollectorPoints" ADD CONSTRAINT "_CollectorPoints_A_fkey" FOREIGN KEY ("A") REFERENCES "collection_points"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CollectorPoints" ADD CONSTRAINT "_CollectorPoints_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Official receipt number sequence (R-YYYY-NNNNNN), used inside the verification transaction.
-- Hand-added (the one allowed manual edit of a generated migration).
CREATE SEQUENCE "official_receipt_seq" START 1;
