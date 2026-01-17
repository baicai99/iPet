-- Add tags and pin fields for Article management
ALTER TABLE "Article"
    ADD COLUMN IF NOT EXISTS "tags" TEXT[] NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS "sectionPinned" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "sectionPinnedAt" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "pinnedMetrics" TEXT[] NOT NULL DEFAULT '{}';
