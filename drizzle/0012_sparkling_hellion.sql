ALTER TABLE `companies` ADD `partnerCode` varchar(20);--> statement-breakpoint
ALTER TABLE `companies` ADD CONSTRAINT `companies_partnerCode_unique` UNIQUE(`partnerCode`);