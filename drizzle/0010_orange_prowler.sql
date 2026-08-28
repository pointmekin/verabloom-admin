CREATE TABLE "payouts" (
	"id" serial PRIMARY KEY NOT NULL,
	"recipient" text NOT NULL,
	"amount_thb" numeric(12, 2) NOT NULL,
	"payout_date" date NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
