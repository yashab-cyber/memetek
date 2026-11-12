-- Migration: Create airdrop submission tables
-- MEMETEK Airdrop Database Schema

-- ═══════════════════════════════════════════
-- TABLE 1: Telegram Direct Airdrop (50 spots)
-- ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS telegram_airdrop (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sol_address TEXT NOT NULL,
  x_username TEXT NOT NULL,
  telegram_username TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Prevent duplicate entries by SOL address or Telegram username
CREATE UNIQUE INDEX IF NOT EXISTS idx_tg_sol_address ON telegram_airdrop (sol_address);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tg_telegram_username ON telegram_airdrop (telegram_username);

-- ═══════════════════════════════════════════
-- TABLE 2: Random Community Airdrop (1000 winners)
-- ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS random_airdrop (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sol_address TEXT NOT NULL,
  x_username TEXT NOT NULL,
  telegram_username TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Prevent duplicate entries by SOL address or Telegram username
CREATE UNIQUE INDEX IF NOT EXISTS idx_rd_sol_address ON random_airdrop (sol_address);
CREATE UNIQUE INDEX IF NOT EXISTS idx_rd_telegram_username ON random_airdrop (telegram_username);

-- ═══════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════
-- Enable RLS on both tables
ALTER TABLE telegram_airdrop ENABLE ROW LEVEL SECURITY;
ALTER TABLE random_airdrop ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (public form submissions)
CREATE POLICY "Allow public inserts on telegram_airdrop"
  ON telegram_airdrop
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public inserts on random_airdrop"
  ON random_airdrop
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Only service_role (admin) can SELECT/UPDATE/DELETE
-- (No select policy for anon = users can't read other submissions)
