/*
  Warnings:

  - You are about to drop the column `fundingAsk` on the `VisionaryProfile` table. All the data in the column will be lost.
  - The `halalCategory` column on the `VisionaryProfile` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `email` to the `InvestorProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fullName` to the `InvestorProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `VisionaryProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fullName` to the `VisionaryProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `industry` to the `VisionaryProfile` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "HalalCategory" AS ENUM ('halal', 'grey', 'forbidden');

-- DropForeignKey
ALTER TABLE "InvestorProfile" DROP CONSTRAINT "InvestorProfile_userId_fkey";

-- DropIndex
DROP INDEX "VisionaryProfile_sector_idx";

-- AlterTable
ALTER TABLE "InvestorProfile" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "fullName" TEXT NOT NULL,
ADD COLUMN     "halalCategory" "HalalCategory",
ADD COLUMN     "halalResponses" JSONB,
ADD COLUMN     "halalScore" INTEGER DEFAULT 0,
ADD COLUMN     "industriesInterestedIn" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "investmentPreferences" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "profileComplete" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "preferredSectors" SET DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "fullName" TEXT;

-- AlterTable
ALTER TABLE "VisionaryProfile" DROP COLUMN "fundingAsk",
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "fullName" TEXT NOT NULL,
ADD COLUMN     "fundingNeeded" INTEGER,
ADD COLUMN     "halalScore" INTEGER DEFAULT 0,
ADD COLUMN     "industry" TEXT NOT NULL,
ADD COLUMN     "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "profileComplete" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "sector" DROP NOT NULL,
DROP COLUMN "halalCategory",
ADD COLUMN     "halalCategory" "HalalCategory";

-- CreateIndex
CREATE INDEX "InvestorProfile_halalCategory_idx" ON "InvestorProfile"("halalCategory");

-- CreateIndex
CREATE INDEX "InvestorProfile_halalScore_idx" ON "InvestorProfile"("halalScore");

-- CreateIndex
CREATE INDEX "InvestorProfile_profileComplete_idx" ON "InvestorProfile"("profileComplete");

-- CreateIndex
CREATE INDEX "InvestorProfile_onboardingComplete_idx" ON "InvestorProfile"("onboardingComplete");

-- CreateIndex
CREATE INDEX "VisionaryProfile_industry_idx" ON "VisionaryProfile"("industry");

-- CreateIndex
CREATE INDEX "VisionaryProfile_halalCategory_idx" ON "VisionaryProfile"("halalCategory");

-- CreateIndex
CREATE INDEX "VisionaryProfile_halalScore_idx" ON "VisionaryProfile"("halalScore");

-- CreateIndex
CREATE INDEX "VisionaryProfile_profileComplete_idx" ON "VisionaryProfile"("profileComplete");

-- CreateIndex
CREATE INDEX "VisionaryProfile_onboardingComplete_idx" ON "VisionaryProfile"("onboardingComplete");

-- AddForeignKey
ALTER TABLE "InvestorProfile" ADD CONSTRAINT "InvestorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
