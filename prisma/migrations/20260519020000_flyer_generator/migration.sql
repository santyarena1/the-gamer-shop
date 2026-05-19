-- CreateTable
CREATE TABLE "flyer_generations" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL DEFAULT 'tgs_pc_gamer_1080_v1',
    "title" TEXT NOT NULL,
    "categoryLabel" TEXT NOT NULL DEFAULT 'PC GAMER',
    "titleLine1" TEXT NOT NULL,
    "titleLine2" TEXT NOT NULL,
    "payloadJson" TEXT NOT NULL,
    "outputPath" TEXT,
    "caseImagePath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" TEXT NOT NULL,
    "quoteDocumentId" TEXT,

    CONSTRAINT "flyer_generations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_settings" (
    "id" TEXT NOT NULL,
    "encryptedApiKey" TEXT,
    "defaultModel" TEXT NOT NULL DEFAULT 'gpt-image-1',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_settings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "flyer_generations" ADD CONSTRAINT "flyer_generations_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flyer_generations" ADD CONSTRAINT "flyer_generations_quoteDocumentId_fkey" FOREIGN KEY ("quoteDocumentId") REFERENCES "quote_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
