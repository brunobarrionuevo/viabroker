ALTER TABLE `companies` ADD `personType` enum('fisica','juridica') DEFAULT 'juridica' NOT NULL;--> statement-breakpoint
ALTER TABLE `companies` ADD `cpf` varchar(14);