ALTER TABLE "orders"
ALTER COLUMN "task_owner" SET DATA TYPE text[]
USING CASE
  WHEN "task_owner" IS NULL THEN NULL
  ELSE ARRAY["task_owner"]
END;
