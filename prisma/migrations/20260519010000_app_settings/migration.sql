-- CreateTable
CREATE TABLE "app_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "shopName" TEXT NOT NULL DEFAULT 'The Gamer Shop',
    "tagline" TEXT NOT NULL DEFAULT 'Panel de Gestión',
    "accentColor" TEXT NOT NULL DEFAULT '#22c55e',
    "logoUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "app_settings" ("id", "shopName", "tagline", "accentColor", "updatedAt")
VALUES ('default', 'The Gamer Shop', 'Panel de Gestión', '#22c55e', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
