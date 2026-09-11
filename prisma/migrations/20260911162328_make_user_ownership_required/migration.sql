/*
  Warnings:

  - Made the column `userId` on table `DietPlan` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `Exercise` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `Food` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `Habit` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `Rule` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `Task` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `TimetableEntry` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `WorkoutProgram` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "DietPlan" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Exercise" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Food" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Habit" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Rule" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Task" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "TimetableEntry" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "WorkoutProgram" ALTER COLUMN "userId" SET NOT NULL;
