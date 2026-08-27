CREATE TABLE "expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"description" text NOT NULL,
	"payer" text NOT NULL,
	"total_amount_thb" numeric(12, 2) NOT NULL,
	"expense_date" date NOT NULL,
	"quantity" integer,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
