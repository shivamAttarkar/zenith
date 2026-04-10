ALTER TABLE "friend_request" DROP CONSTRAINT "friend_request_senderId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "friend_request" DROP CONSTRAINT "friend_request_receiverId_user_id_fk";
--> statement-breakpoint
DROP INDEX "friend_request_fromUserId_idx";--> statement-breakpoint
DROP INDEX "friend_request_toUserId_idx";--> statement-breakpoint
ALTER TABLE "friend_request" ADD COLUMN "sender_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "friend_request" ADD COLUMN "receiver_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "friend_request" ADD CONSTRAINT "friend_request_sender_id_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friend_request" ADD CONSTRAINT "friend_request_receiver_id_user_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "friend_request_fromUserId_idx" ON "friend_request" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "friend_request_toUserId_idx" ON "friend_request" USING btree ("receiver_id");--> statement-breakpoint
ALTER TABLE "friend_request" DROP COLUMN "senderId";--> statement-breakpoint
ALTER TABLE "friend_request" DROP COLUMN "receiverId";