/*
  Warnings:

  - A unique constraint covering the columns `[taskNumber]` on the table `tasks` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "taskNumber" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "tasks_taskNumber_key" ON "tasks"("taskNumber");
