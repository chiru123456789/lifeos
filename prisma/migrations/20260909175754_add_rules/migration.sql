-- CreateTable
CREATE TABLE "Rule" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'MUST_DO',
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Rule_type_idx" ON "Rule"("type");

-- CreateIndex
CREATE INDEX "Rule_enabled_idx" ON "Rule"("enabled");

-- CreateIndex
CREATE INDEX "Rule_priority_idx" ON "Rule"("priority");
