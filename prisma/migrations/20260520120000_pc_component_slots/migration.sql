-- Nuevas categorías de componentes (cotizador)
ALTER TYPE "PcComponentSlot" ADD VALUE IF NOT EXISTS 'SSD_NVME';
ALTER TYPE "PcComponentSlot" ADD VALUE IF NOT EXISTS 'HDD';
ALTER TYPE "PcComponentSlot" ADD VALUE IF NOT EXISTS 'KEYBOARD';
ALTER TYPE "PcComponentSlot" ADD VALUE IF NOT EXISTS 'MOUSE';
ALTER TYPE "PcComponentSlot" ADD VALUE IF NOT EXISTS 'HEADPHONES';

UPDATE "quote_line_items" SET "slot" = 'SSD_NVME' WHERE "slot" = 'STORAGE';
