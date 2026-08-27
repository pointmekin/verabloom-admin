ALTER TABLE "products" ADD COLUMN "starting_price_thb" numeric(12, 2);--> statement-breakpoint
UPDATE "products" SET "starting_price_thb" = (
	SELECT MIN("product_variations"."starting_price_thb")
	FROM "product_variations"
	WHERE "product_variations"."product_id" = "products"."id"
);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "task_owner" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "recipient_name" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "recipient_phone" text;--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_variation_id_product_variations_id_fk";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "variation_id";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "variation_name_snapshot";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "starting_price_thb_snapshot";--> statement-breakpoint
DROP TABLE "product_variations" CASCADE;
