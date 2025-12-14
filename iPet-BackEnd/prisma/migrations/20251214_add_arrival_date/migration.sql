-- Add arrivalDate column to Pet table
ALTER TABLE "Pet" ADD COLUMN "arrivalDate" TEXT;

-- Add comment
COMMENT ON COLUMN "Pet"."arrivalDate" IS 'Date when pet arrived home (YYYY-MM-DD format)';
