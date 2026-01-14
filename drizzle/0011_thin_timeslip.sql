CREATE TABLE `partnerships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requesterId` int NOT NULL,
	`partnerId` int NOT NULL,
	`status` enum('pending','accepted','rejected','canceled') NOT NULL DEFAULT 'pending',
	`shareAllProperties` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`acceptedAt` timestamp,
	`rejectedAt` timestamp,
	CONSTRAINT `partnerships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `propertyShares` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`ownerCompanyId` int NOT NULL,
	`partnerCompanyId` int NOT NULL,
	`partnershipId` int NOT NULL,
	`status` enum('pending','accepted','rejected','revoked') NOT NULL DEFAULT 'pending',
	`partnerPropertyCode` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`acceptedAt` timestamp,
	CONSTRAINT `propertyShares_id` PRIMARY KEY(`id`)
);
