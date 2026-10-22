CREATE TABLE `audit_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`guild_id` text NOT NULL,
	`actor_id` text NOT NULL,
	`action` text NOT NULL,
	`target_id` text,
	`metadata_json` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_guild_created_idx` ON `audit_log` (`guild_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `guild_settings` (
	`guild_id` text PRIMARY KEY NOT NULL,
	`locale` text DEFAULT 'ar' NOT NULL,
	`timezone` text DEFAULT 'Asia/Riyadh' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`modules_json` text NOT NULL,
	`logging_json` text NOT NULL,
	`welcome_json` text NOT NULL,
	`tickets_json` text NOT NULL,
	`music_json` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`run_at` integer NOT NULL,
	`payload_json` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`locked_until` integer,
	`unique_key` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `jobs_unique_key_unique` ON `jobs` (`unique_key`);--> statement-breakpoint
CREATE INDEX `jobs_status_run_idx` ON `jobs` (`status`,`run_at`);--> statement-breakpoint
CREATE TABLE `users` (
	`user_id` text PRIMARY KEY NOT NULL,
	`locale` text,
	`timezone` text,
	`created_at` integer NOT NULL
);
