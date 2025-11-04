-- Migration: Add stripeCustomerId to users table
-- Date: 2025-11-04

ALTER TABLE users ADD COLUMN IF NOT EXISTS "stripeCustomerId" VARCHAR(128);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users("stripeCustomerId");

-- Comment
COMMENT ON COLUMN users."stripeCustomerId" IS 'Stripe customer ID for billing';
