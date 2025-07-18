/*
  Warnings:

  - Made the column `content` on table `Argument` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Argument" ALTER COLUMN "content" SET NOT NULL;
