-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Tenant_deleted_at_idx" ON "Tenant"("deleted_at");