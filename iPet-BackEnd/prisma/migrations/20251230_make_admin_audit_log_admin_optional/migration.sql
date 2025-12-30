-- Make adminId optional for audit logs to support failed login attempts.
ALTER TABLE "AdminAuditLog" DROP CONSTRAINT "AdminAuditLog_adminId_fkey";
ALTER TABLE "AdminAuditLog" ALTER COLUMN "adminId" DROP NOT NULL;
ALTER TABLE "AdminAuditLog"
ADD CONSTRAINT "AdminAuditLog_adminId_fkey"
FOREIGN KEY ("adminId") REFERENCES "Admin"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
