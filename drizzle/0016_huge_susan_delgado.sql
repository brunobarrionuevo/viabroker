CREATE TABLE `social_connections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`platform` enum('facebook','instagram') NOT NULL,
	`platformUserId` varchar(100),
	`platformPageId` varchar(100),
	`platformPageName` varchar(255),
	`platformUsername` varchar(100),
	`accessToken` text,
	`accessTokenExpires` timestamp,
	`refreshToken` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`lastUsedAt` timestamp,
	`lastError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `social_connections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `social_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`connectionId` int NOT NULL,
	`propertyId` int,
	`platform` enum('facebook','instagram') NOT NULL,
	`postType` enum('text','photo','video','carousel') NOT NULL DEFAULT 'text',
	`content` text NOT NULL,
	`mediaUrls` json,
	`platformPostId` varchar(100),
	`platformPostUrl` text,
	`status` enum('draft','scheduled','published','failed') NOT NULL DEFAULT 'draft',
	`scheduledFor` timestamp,
	`publishedAt` timestamp,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `social_posts_id` PRIMARY KEY(`id`)
);
