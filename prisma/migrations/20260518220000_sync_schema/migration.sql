-- CreateEnum
CREATE TYPE "SalaryStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PARTIAL', 'PAID');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('PARTIAL', 'ADVANCE', 'FINAL');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('ARS', 'USD', 'USDT', 'OTHER');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('UTILITIES', 'INTERNET', 'PROFESSIONAL', 'PAYROLL_TAXES', 'CHECKS', 'RENT', 'INSURANCE', 'OTHER');

-- AlterTable
ALTER TABLE "salaries" ADD COLUMN     "debtDeduction" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "grossAmount" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "ipcIncrease" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "ipcPercentage" DECIMAL(6,3),
ADD COLUMN     "previousBase" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "status" "SalaryStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "baseSalary" DECIMAL(12,2),
ADD COLUMN     "ipcAdjusted" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "monthly_ipc" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "percentage" DECIMAL(6,3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monthly_ipc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_payments" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'ARS',
    "exchangeRate" DECIMAL(12,4) NOT NULL DEFAULT 1,
    "amountArs" DECIMAL(12,2) NOT NULL,
    "type" "PaymentType" NOT NULL DEFAULT 'PARTIAL',
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "salaryId" TEXT NOT NULL,

    CONSTRAINT "salary_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_debts" (
    "salaryId" TEXT NOT NULL,
    "debtId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "salary_debts_pkey" PRIMARY KEY ("salaryId","debtId")
);

-- CreateTable
CREATE TABLE "corporate_cards" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'Tarjeta empresarial',
    "lastFour" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "corporate_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "corporate_card_statements" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "closingDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cardId" TEXT NOT NULL,
    "debtId" TEXT,

    CONSTRAINT "corporate_card_statements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_vendors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL DEFAULT 'OTHER',
    "description" TEXT,
    "typicalDay" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_payments" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "vendorId" TEXT NOT NULL,

    CONSTRAINT "recurring_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_threads" (
    "id" TEXT NOT NULL,
    "clientName" TEXT,
    "clientPhone" TEXT,
    "subject" TEXT,
    "statusLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "quote_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_messages" (
    "id" TEXT NOT NULL,
    "body" TEXT,
    "fileName" TEXT,
    "filePath" TEXT,
    "mimeType" TEXT,
    "isAction" BOOLEAN NOT NULL DEFAULT false,
    "actionLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "threadId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "quote_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_quick_buttons" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "variant" TEXT NOT NULL DEFAULT 'default',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "quote_quick_buttons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "monthly_ipc_month_year_key" ON "monthly_ipc"("month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "corporate_cards_userId_key" ON "corporate_cards"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "corporate_card_statements_debtId_key" ON "corporate_card_statements"("debtId");

-- CreateIndex
CREATE UNIQUE INDEX "corporate_card_statements_cardId_month_year_key" ON "corporate_card_statements"("cardId", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "recurring_payments_vendorId_month_year_key" ON "recurring_payments"("vendorId", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "salaries_userId_month_year_key" ON "salaries"("userId", "month", "year");

-- AddForeignKey
ALTER TABLE "salary_payments" ADD CONSTRAINT "salary_payments_salaryId_fkey" FOREIGN KEY ("salaryId") REFERENCES "salaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_debts" ADD CONSTRAINT "salary_debts_salaryId_fkey" FOREIGN KEY ("salaryId") REFERENCES "salaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_debts" ADD CONSTRAINT "salary_debts_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "debts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corporate_cards" ADD CONSTRAINT "corporate_cards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corporate_card_statements" ADD CONSTRAINT "corporate_card_statements_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "corporate_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corporate_card_statements" ADD CONSTRAINT "corporate_card_statements_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "debts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_payments" ADD CONSTRAINT "recurring_payments_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "recurring_vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_threads" ADD CONSTRAINT "quote_threads_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_messages" ADD CONSTRAINT "quote_messages_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "quote_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_messages" ADD CONSTRAINT "quote_messages_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

