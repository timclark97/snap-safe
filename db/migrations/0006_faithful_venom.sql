CREATE TABLE `album_invites` (
	`id` text PRIMARY KEY NOT NULL,
	`created_on` integer NOT NULL,
	`shared_to` text NOT NULL,
	`shared_by` text NOT NULL,
	`album_id` text NOT NULL,
	`wk` text NOT NULL,
	FOREIGN KEY (`shared_to`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`shared_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`album_id`) REFERENCES `albums`(`id`) ON UPDATE no action ON DELETE cascade
);
