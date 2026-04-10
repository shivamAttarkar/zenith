CREATE TABLE `conversation` (
	`id` text PRIMARY KEY NOT NULL,
	`user1_id` text NOT NULL,
	`user2_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user1_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user2_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `conversation_pair_idx` ON `conversation` (`user1_id`,`user2_id`);--> statement-breakpoint
CREATE INDEX `conversation_user2_idx` ON `conversation` (`user2_id`);--> statement-breakpoint
CREATE TABLE `friend_request` (
	`id` text PRIMARY KEY NOT NULL,
	`sender_id` text NOT NULL,
	`receiver_id` text NOT NULL,
	`challenge` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`verified_by_sender` integer DEFAULT false NOT NULL,
	`verified_by_receiver` integer DEFAULT false NOT NULL,
	`expires_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`sender_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`receiver_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `friend_request_fromUserId_idx` ON `friend_request` (`sender_id`);--> statement-breakpoint
CREATE INDEX `friend_request_toUserId_idx` ON `friend_request` (`receiver_id`);--> statement-breakpoint
CREATE TABLE `message` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`sender_id` text NOT NULL,
	`format` text NOT NULL,
	`mime_type` text,
	`payload` text NOT NULL,
	`status` text DEFAULT 'sent' NOT NULL,
	`ts` integer NOT NULL,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversation`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sender_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `message_conversation_ts_idx` ON `message` (`conversation_id`,`ts`);--> statement-breakpoint
CREATE INDEX `message_sender_idx` ON `message` (`sender_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`image` text,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `user_public_key` (
	`user_id` text PRIMARY KEY NOT NULL,
	`public_key` text NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
