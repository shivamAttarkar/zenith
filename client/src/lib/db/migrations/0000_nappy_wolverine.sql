CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`image` text,
	`public_key` text,
	`cached_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`contact_id` text NOT NULL,
	`last_message_id` text,
	`last_message_at` integer,
	`unread_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`contact_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`sender_id` text NOT NULL,
	`receiver_id` text NOT NULL,
	`payload` text NOT NULL,
	`format` text DEFAULT 'string' NOT NULL,
	`timestamp` integer NOT NULL,
	`status` text DEFAULT 'sending' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `messages_conversation_timestamp_idx` ON `messages` (`conversation_id`,`timestamp`);--> statement-breakpoint
CREATE TABLE `friend_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`sender_id` text NOT NULL,
	`receiver_id` text NOT NULL,
	`status` text NOT NULL,
	`verified_by_sender` integer DEFAULT false NOT NULL,
	`verified_by_receiver` integer DEFAULT false NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`synced_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `friend_requests_sender_idx` ON `friend_requests` (`sender_id`);--> statement-breakpoint
CREATE INDEX `friend_requests_receiver_idx` ON `friend_requests` (`receiver_id`);--> statement-breakpoint
CREATE INDEX `friend_requests_status_idx` ON `friend_requests` (`status`);