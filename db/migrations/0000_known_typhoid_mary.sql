CREATE TABLE `auth_methods` (
	`id` text PRIMARY KEY NOT NULL,
	`created_on` integer NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`value` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`created_on` integer NOT NULL,
	`user_id` text NOT NULL,
	`expires_on` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`created_on` integer NOT NULL,
	`updated_on` integer NOT NULL,
	`first_name` text DEFAULT '' NOT NULL,
	`last_name` text DEFAULT '' NOT NULL
);
