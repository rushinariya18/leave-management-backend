/*
  Warnings:

  - Added the required column `updatedAt` to the `public_holidays` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public_holidays" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
