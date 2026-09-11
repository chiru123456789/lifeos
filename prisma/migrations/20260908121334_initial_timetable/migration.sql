-- CreateTable
CREATE TABLE "TimetableEntry" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Personal',
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "dayOfWeek" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimetableEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TimetableEntry_dayOfWeek_idx" ON "TimetableEntry"("dayOfWeek");

-- CreateIndex
CREATE INDEX "TimetableEntry_enabled_idx" ON "TimetableEntry"("enabled");
