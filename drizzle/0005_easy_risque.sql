CREATE TABLE `activity_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorType` enum('master_admin','user','system') NOT NULL,
	`actorId` int,
	`action` varchar(100) NOT NULL,
	`entityType` varchar(50),
	`entityId` int,
	`details` json,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `master_admins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(50) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`name` varchar(100) NOT NULL,
	`email` varchar(320),
	`isActive` boolean NOT NULL DEFAULT true,
	`lastLoginAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `master_admins_id` PRIMARY KEY(`id`),
	CONSTRAINT `master_admins_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`subscriptionId` int,
	`stripePaymentIntentId` varchar(100),
	`stripeInvoiceId` varchar(100),
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'BRL',
	`status` enum('pending','succeeded','failed','refunded','canceled') NOT NULL DEFAULT 'pending',
	`paymentMethod` varchar(50),
	`description` varchar(255),
	`invoiceUrl` text,
	`receiptUrl` text,
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`planId` int NOT NULL,
	`status` enum('active','canceled','past_due','trialing','paused','expired') NOT NULL DEFAULT 'trialing',
	`stripeCustomerId` varchar(100),
	`stripeSubscriptionId` varchar(100),
	`stripePriceId` varchar(100),
	`currentPeriodStart` timestamp,
	`currentPeriodEnd` timestamp,
	`cancelAtPeriodEnd` boolean DEFAULT false,
	`canceledAt` timestamp,
	`trialStart` timestamp,
	`trialEnd` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
