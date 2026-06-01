-- CreateTable
CREATE TABLE "marketing_brands" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_purchase_goal_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetAmount" DECIMAL(12,2) NOT NULL,
    "currentAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "brandId" TEXT NOT NULL,

    CONSTRAINT "marketing_purchase_goal_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "marketing_brands_name_key" ON "marketing_brands"("name");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_purchase_goal_categories_brandId_name_key" ON "marketing_purchase_goal_categories"("brandId", "name");

-- AddForeignKey
ALTER TABLE "marketing_purchase_goal_categories" ADD CONSTRAINT "marketing_purchase_goal_categories_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "marketing_brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;
