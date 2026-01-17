-- Create ArticleCategory table for managed categories
CREATE TABLE IF NOT EXISTS "ArticleCategory" (
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArticleCategory_pkey" PRIMARY KEY ("key")
);

CREATE INDEX IF NOT EXISTS "idx_article_category_order" ON "ArticleCategory"("order");
