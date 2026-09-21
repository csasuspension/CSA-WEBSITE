CREATE TABLE `catalog_products` (
	`sku` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`vehicle_make` text DEFAULT 'TOYOTA' NOT NULL,
	`vehicle_model` text NOT NULL,
	`model_number` text DEFAULT '' NOT NULL,
	`category` text DEFAULT 'Shock Absorber' NOT NULL,
	`position` text DEFAULT 'Full Set' NOT NULL,
	`year_from` integer,
	`year_to` integer,
	`price` integer DEFAULT 0 NOT NULL,
	`stock` integer DEFAULT 0 NOT NULL,
	`tag` text DEFAULT 'CSA' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
