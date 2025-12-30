-- Normalize legacy super_admin role to admin.
UPDATE "Admin"
SET "role" = 'admin'
WHERE "role" = 'super_admin';
