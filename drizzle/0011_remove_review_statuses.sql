ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'work_in_progress';--> statement-breakpoint
UPDATE "orders" SET "status" = 'work_in_progress' WHERE "status" IN ('pending_review', 'confirmed');
