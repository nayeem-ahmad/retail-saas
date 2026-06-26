-- AlterTable
ALTER TABLE "SupplierCreditTransaction" ADD COLUMN "payment_number" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "SupplierCreditTransaction_tenant_id_payment_number_key" ON "SupplierCreditTransaction"("tenant_id", "payment_number");