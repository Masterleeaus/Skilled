-- AlterTable
ALTER TABLE "enrollments" ADD COLUMN     "licenceTrack" TEXT NOT NULL DEFAULT 'non-licensed';

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "licenceTrack" TEXT NOT NULL DEFAULT 'non-licensed';
