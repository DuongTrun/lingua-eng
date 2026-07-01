-- AlterTable
ALTER TABLE "users" ADD COLUMN     "daily_goal_xp" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "last_active_at" TIMESTAMP(3);
