CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_reference" text NOT NULL,
	"status" text DEFAULT 'pending_review' NOT NULL,
	"product_id" integer NOT NULL,
	"variation_id" integer NOT NULL,
	"product_name_snapshot" text NOT NULL,
	"variation_name_snapshot" text NOT NULL,
	"starting_price_thb_snapshot" numeric(12, 2),
	"quantity" integer NOT NULL,
	"customer_name" text NOT NULL,
	"social_channel" text NOT NULL,
	"social_contact" text NOT NULL,
	"phone" text,
	"request_details" text DEFAULT '' NOT NULL,
	"delivery_method" text NOT NULL,
	"order_address" text,
	"required_date" date NOT NULL,
	"order_value_thb" numeric(12, 2),
	"internal_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_request_reference_unique" UNIQUE("request_reference")
);
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_variation_id_product_variations_id_fk" FOREIGN KEY ("variation_id") REFERENCES "public"."product_variations"("id") ON DELETE restrict ON UPDATE no action;