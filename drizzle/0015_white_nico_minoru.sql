ALTER TABLE `property_images` MODIFY COLUMN `url` text;--> statement-breakpoint
ALTER TABLE `property_images` ADD `imageData` longtext;--> statement-breakpoint
ALTER TABLE `property_images` ADD `mimeType` varchar(50);