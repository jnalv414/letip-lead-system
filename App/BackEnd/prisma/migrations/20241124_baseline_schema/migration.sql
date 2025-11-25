-- CreateTable
CREATE TABLE "business" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT DEFAULT 'NJ',
    "zip" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "business_type" TEXT,
    "industry" TEXT,
    "employee_count" INTEGER,
    "year_founded" INTEGER,
    "google_maps_url" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "enrichment_status" TEXT NOT NULL DEFAULT 'pending',
    "source" TEXT NOT NULL DEFAULT 'google_maps',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact" (
    "id" SERIAL NOT NULL,
    "business_id" INTEGER NOT NULL,
    "name" TEXT,
    "title" TEXT,
    "email" TEXT,
    "email_verified" BOOLEAN DEFAULT false,
    "phone" TEXT,
    "linkedin_url" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrichment_log" (
    "id" SERIAL NOT NULL,
    "business_id" INTEGER NOT NULL,
    "service" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "request_data" TEXT,
    "response_data" TEXT,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enrichment_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outreach_message" (
    "id" SERIAL NOT NULL,
    "business_id" INTEGER NOT NULL,
    "contact_id" INTEGER,
    "message_text" TEXT NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'generated',

    CONSTRAINT "outreach_message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_history" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "queueName" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "result" JSONB,
    "error" JSONB,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "attemptsMade" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),

    CONSTRAINT "job_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "business_city_idx" ON "business"("city");

-- CreateIndex
CREATE INDEX "business_industry_idx" ON "business"("industry");

-- CreateIndex
CREATE INDEX "business_enrichment_status_idx" ON "business"("enrichment_status");

-- CreateIndex
CREATE INDEX "contact_business_id_idx" ON "contact"("business_id");

-- CreateIndex
CREATE INDEX "contact_email_idx" ON "contact"("email");

-- CreateIndex
CREATE INDEX "enrichment_log_business_id_idx" ON "enrichment_log"("business_id");

-- CreateIndex
CREATE INDEX "enrichment_log_service_idx" ON "enrichment_log"("service");

-- CreateIndex
CREATE INDEX "enrichment_log_status_idx" ON "enrichment_log"("status");

-- CreateIndex
CREATE INDEX "outreach_message_business_id_idx" ON "outreach_message"("business_id");

-- CreateIndex
CREATE INDEX "outreach_message_status_idx" ON "outreach_message"("status");

-- CreateIndex
CREATE UNIQUE INDEX "job_history_jobId_key" ON "job_history"("jobId");

-- CreateIndex
CREATE INDEX "job_history_userId_idx" ON "job_history"("userId");

-- CreateIndex
CREATE INDEX "job_history_status_idx" ON "job_history"("status");

-- CreateIndex
CREATE INDEX "job_history_queueName_status_idx" ON "job_history"("queueName", "status");

-- CreateIndex
CREATE INDEX "job_history_createdAt_idx" ON "job_history"("createdAt");

-- AddForeignKey
ALTER TABLE "contact" ADD CONSTRAINT "contact_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrichment_log" ADD CONSTRAINT "enrichment_log_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outreach_message" ADD CONSTRAINT "outreach_message_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outreach_message" ADD CONSTRAINT "outreach_message_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
