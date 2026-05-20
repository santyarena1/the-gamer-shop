-- Margen del presupuesto y costo por línea
ALTER TABLE "quote_documents" ADD COLUMN IF NOT EXISTS "markupPercent" DECIMAL(5,2) NOT NULL DEFAULT 30;

ALTER TABLE "quote_line_items" ADD COLUMN IF NOT EXISTS "unitCost" DECIMAL(12,2) NOT NULL DEFAULT 0;

UPDATE "quote_line_items"
SET "unitCost" = "unitPrice" / 1.30
WHERE "unitCost" = 0 AND "unitPrice" > 0;
