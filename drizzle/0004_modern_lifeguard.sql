ALTER TABLE `site_settings` ADD `accentColor` varchar(7) DEFAULT '#FF6B35';--> statement-breakpoint
ALTER TABLE `site_settings` ADD `backgroundColor` varchar(7) DEFAULT '#FFFFFF';--> statement-breakpoint
ALTER TABLE `site_settings` ADD `textColor` varchar(7) DEFAULT '#1F2937';--> statement-breakpoint
ALTER TABLE `site_settings` ADD `logoUrl` text;--> statement-breakpoint
ALTER TABLE `site_settings` ADD `faviconUrl` text;--> statement-breakpoint
ALTER TABLE `site_settings` ADD `heroImageUrl` text;--> statement-breakpoint
ALTER TABLE `site_settings` ADD `heroTitle` varchar(100);--> statement-breakpoint
ALTER TABLE `site_settings` ADD `heroSubtitle` varchar(200);--> statement-breakpoint
ALTER TABLE `site_settings` ADD `tiktokUrl` varchar(255);--> statement-breakpoint
ALTER TABLE `site_settings` ADD `domainVerified` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `site_settings` ADD `showHeroSearch` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `site_settings` ADD `showFeaturedProperties` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `site_settings` ADD `showTestimonials` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `site_settings` ADD `showAboutSection` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `site_settings` ADD `aboutText` text;--> statement-breakpoint
ALTER TABLE `site_settings` ADD `showContactForm` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `site_settings` ADD `contactEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `site_settings` ADD `contactPhone` varchar(20);--> statement-breakpoint
ALTER TABLE `site_settings` ADD `contactAddress` text;