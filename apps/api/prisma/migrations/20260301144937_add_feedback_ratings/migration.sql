-- AlterTable
ALTER TABLE "MatchFeedback" ADD COLUMN     "ambianceRating" INTEGER,
ADD COLUMN     "fairPlayRating" INTEGER,
ADD COLUMN     "overallRating" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "punctualityRating" INTEGER;
