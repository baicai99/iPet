-- Guest users support (7-day sliding retention)

-- Allow nullable credentials for guest accounts
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;

-- Add guest lifecycle fields
ALTER TABLE "User" ADD COLUMN "isGuest" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "User" ADD COLUMN "guestCreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "User" ADD COLUMN "guestDeviceId" TEXT;
ALTER TABLE "User" ADD COLUMN "guestOrigin" TEXT;

-- Index to accelerate cleanup queries
CREATE INDEX "users_guest_last_active" ON "User"("isGuest", "lastActiveAt");

