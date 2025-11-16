-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('INVESTOR', 'VISIONARY');

-- CreateEnum
CREATE TYPE "SwipeDirection" AS ENUM ('LIKE', 'DISLIKE');

-- CreateEnum
CREATE TYPE "StartupStage" AS ENUM ('IDEA', 'MVP', 'TRACTION', 'SCALING');

-- CreateEnum
CREATE TYPE "RiskCategory" AS ENUM ('HALAL', 'GREY', 'HARAM');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole",
    "avatarUrl" TEXT,
    "location" TEXT,
    "pushToken" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "minTicketSize" INTEGER,
    "maxTicketSize" INTEGER,
    "preferredSectors" TEXT[],
    "geoFocus" TEXT,
    "investmentThesis" TEXT,
    "hasAcceptedHalalTerms" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisionaryProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startupName" TEXT NOT NULL,
    "tagline" TEXT,
    "startupStage" "StartupStage" NOT NULL,
    "sector" TEXT NOT NULL,
    "description" TEXT,
    "pitch" TEXT,
    "fundingAsk" INTEGER,
    "location" TEXT,
    "websiteUrl" TEXT,
    "logoUrl" TEXT,
    "teamSize" INTEGER,
    "halalCategory" TEXT,
    "riskCategory" "RiskCategory",
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "rejectionReason" TEXT,
    "halalResponses" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VisionaryProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Swipe" (
    "id" TEXT NOT NULL,
    "swiperId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "direction" "SwipeDirection" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Swipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "userAId" TEXT NOT NULL,
    "userBId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "readBy" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BarakahScore" (
    "id" TEXT NOT NULL,
    "visionaryProfileId" TEXT NOT NULL,
    "score" SMALLINT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "BarakahScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shortlist" (
    "id" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "visionaryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Shortlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileView" (
    "id" TEXT NOT NULL,
    "visionaryId" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_clerkId_idx" ON "User"("clerkId");

-- CreateIndex
CREATE INDEX "User_isAdmin_idx" ON "User"("isAdmin");

-- CreateIndex
CREATE INDEX "User_isBanned_idx" ON "User"("isBanned");

-- CreateIndex
CREATE UNIQUE INDEX "InvestorProfile_userId_key" ON "InvestorProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VisionaryProfile_userId_key" ON "VisionaryProfile"("userId");

-- CreateIndex
CREATE INDEX "VisionaryProfile_sector_idx" ON "VisionaryProfile"("sector");

-- CreateIndex
CREATE INDEX "VisionaryProfile_startupStage_idx" ON "VisionaryProfile"("startupStage");

-- CreateIndex
CREATE INDEX "VisionaryProfile_location_idx" ON "VisionaryProfile"("location");

-- CreateIndex
CREATE INDEX "VisionaryProfile_halalCategory_idx" ON "VisionaryProfile"("halalCategory");

-- CreateIndex
CREATE INDEX "VisionaryProfile_riskCategory_idx" ON "VisionaryProfile"("riskCategory");

-- CreateIndex
CREATE INDEX "VisionaryProfile_isApproved_idx" ON "VisionaryProfile"("isApproved");

-- CreateIndex
CREATE INDEX "VisionaryProfile_isFlagged_idx" ON "VisionaryProfile"("isFlagged");

-- CreateIndex
CREATE INDEX "Swipe_swiperId_idx" ON "Swipe"("swiperId");

-- CreateIndex
CREATE INDEX "Swipe_targetId_idx" ON "Swipe"("targetId");

-- CreateIndex
CREATE UNIQUE INDEX "Swipe_swiperId_targetId_key" ON "Swipe"("swiperId", "targetId");

-- CreateIndex
CREATE INDEX "Match_userAId_idx" ON "Match"("userAId");

-- CreateIndex
CREATE INDEX "Match_userBId_idx" ON "Match"("userBId");

-- CreateIndex
CREATE UNIQUE INDEX "Match_userAId_userBId_key" ON "Match"("userAId", "userBId");

-- CreateIndex
CREATE INDEX "Message_matchId_createdAt_idx" ON "Message"("matchId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- CreateIndex
CREATE UNIQUE INDEX "BarakahScore_visionaryProfileId_key" ON "BarakahScore"("visionaryProfileId");

-- CreateIndex
CREATE INDEX "Shortlist_investorId_idx" ON "Shortlist"("investorId");

-- CreateIndex
CREATE INDEX "Shortlist_visionaryId_idx" ON "Shortlist"("visionaryId");

-- CreateIndex
CREATE UNIQUE INDEX "Shortlist_investorId_visionaryId_key" ON "Shortlist"("investorId", "visionaryId");

-- CreateIndex
CREATE INDEX "ProfileView_visionaryId_createdAt_idx" ON "ProfileView"("visionaryId", "createdAt");

-- CreateIndex
CREATE INDEX "ProfileView_investorId_createdAt_idx" ON "ProfileView"("investorId", "createdAt");

-- CreateIndex
CREATE INDEX "ProfileView_investorId_visionaryId_idx" ON "ProfileView"("investorId", "visionaryId");

-- AddForeignKey
ALTER TABLE "InvestorProfile" ADD CONSTRAINT "InvestorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisionaryProfile" ADD CONSTRAINT "VisionaryProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Swipe" ADD CONSTRAINT "Swipe_swiperId_fkey" FOREIGN KEY ("swiperId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Swipe" ADD CONSTRAINT "Swipe_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_userAId_fkey" FOREIGN KEY ("userAId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_userBId_fkey" FOREIGN KEY ("userBId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarakahScore" ADD CONSTRAINT "BarakahScore_visionaryProfileId_fkey" FOREIGN KEY ("visionaryProfileId") REFERENCES "VisionaryProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shortlist" ADD CONSTRAINT "Shortlist_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shortlist" ADD CONSTRAINT "Shortlist_visionaryId_fkey" FOREIGN KEY ("visionaryId") REFERENCES "VisionaryProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileView" ADD CONSTRAINT "ProfileView_visionaryId_fkey" FOREIGN KEY ("visionaryId") REFERENCES "VisionaryProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileView" ADD CONSTRAINT "ProfileView_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
