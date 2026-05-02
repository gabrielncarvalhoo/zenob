-- Migration: add_clerk_fields
-- Add Clerk authentication fields to User and Account tables

BEGIN;

-- Add clerkUserId column to users (unique, nullable)
ALTER TABLE "users" ADD COLUMN "clerkUserId" TEXT;

-- Remove unique from email (email is now unique within account via composite)
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key";

-- Add unique constraint on (accountId, email) composite
ALTER TABLE "users" ADD CONSTRAINT "users_accountId_email_key" UNIQUE ("accountId", "email");

-- Add unique index on clerkUserId
ALTER TABLE "users" ADD CONSTRAINT "users_clerkUserId_key" UNIQUE ("clerkUserId");

-- Add clerkOrgId column to accounts (unique, nullable)
ALTER TABLE "accounts" ADD COLUMN "clerkOrgId" TEXT;
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_clerkOrgId_key" UNIQUE ("clerkOrgId");

-- Make passwordHash nullable (Clerk users may not have password)
ALTER TABLE "users" ALTER COLUMN "passwordHash" DROP NOT NULL;

COMMIT;