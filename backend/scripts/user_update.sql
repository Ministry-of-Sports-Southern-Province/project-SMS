ALTER TABLE `users` ADD COLUMN `profile_picture` VARCHAR(500) NULL DEFAULT NULL AFTER `dark_mode`;
ALTER TABLE `users` ADD COLUMN `banner_image` VARCHAR(500) NULL DEFAULT NULL AFTER `profile_picture`;
ALTER TABLE `users` ADD COLUMN `profile_picture_updated_at` DATETIME NULL DEFAULT NULL AFTER `banner_image`;
ALTER TABLE `users` ADD COLUMN `banner_image_updated_at` DATETIME NULL DEFAULT NULL AFTER `profile_picture_updated_at`;