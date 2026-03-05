-- Migration: Add profile picture and banner image columns to users table
-- Run this after initial database setup if columns are not present

ALTER TABLE users ADD COLUMN profile_picture VARCHAR(500) NULL AFTER dark_mode;
ALTER TABLE users ADD COLUMN banner_image VARCHAR(500) NULL AFTER profile_picture;
