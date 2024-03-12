CREATE TABLE `authentication_codes` (
	`id` text PRIMARY KEY NOT NULL,
	`created_on` integer NOT NULL,
	`expires_on` integer NOT NULL,
	`meta_data` text NOT NULL
);
