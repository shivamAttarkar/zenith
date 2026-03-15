CREATE TABLE "friend_request" (
	"id" text PRIMARY KEY NOT NULL,
	"sender" text NOT NULL,
	"receiver" text NOT NULL,
	"challenge" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"verified_by_sender" boolean DEFAULT false NOT NULL,
	"verified_by_receiver" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "friend_request" ADD CONSTRAINT "friend_request_sender_user_id_fk" FOREIGN KEY ("sender") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friend_request" ADD CONSTRAINT "friend_request_receiver_user_id_fk" FOREIGN KEY ("receiver") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "friend_request_fromUserId_idx" ON "friend_request" USING btree ("sender");--> statement-breakpoint
CREATE INDEX "friend_request_toUserId_idx" ON "friend_request" USING btree ("receiver");