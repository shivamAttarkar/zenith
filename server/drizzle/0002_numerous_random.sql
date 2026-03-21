CREATE TABLE "user_public_key" (
	"user_id" text PRIMARY KEY NOT NULL,
	"public_key" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "friend_request" DROP CONSTRAINT "friend_request_sender_user_id_fk";
--> statement-breakpoint
ALTER TABLE "friend_request" DROP CONSTRAINT "friend_request_receiver_user_id_fk";
--> statement-breakpoint
DROP INDEX "friend_request_fromUserId_idx";--> statement-breakpoint
DROP INDEX "friend_request_toUserId_idx";--> statement-breakpoint
ALTER TABLE "friend_request" ALTER COLUMN "expires_at" SET DEFAULT now() + interval '1 month';--> statement-breakpoint
ALTER TABLE "friend_request" ADD COLUMN "senderId" text NOT NULL;--> statement-breakpoint
ALTER TABLE "friend_request" ADD COLUMN "receiverId" text NOT NULL;--> statement-breakpoint
ALTER TABLE "user_public_key" ADD CONSTRAINT "user_public_key_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friend_request" ADD CONSTRAINT "friend_request_senderId_user_id_fk" FOREIGN KEY ("senderId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friend_request" ADD CONSTRAINT "friend_request_receiverId_user_id_fk" FOREIGN KEY ("receiverId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "friend_request_fromUserId_idx" ON "friend_request" USING btree ("senderId");--> statement-breakpoint
CREATE INDEX "friend_request_toUserId_idx" ON "friend_request" USING btree ("receiverId");--> statement-breakpoint
ALTER TABLE "friend_request" DROP COLUMN "sender";--> statement-breakpoint
ALTER TABLE "friend_request" DROP COLUMN "receiver";