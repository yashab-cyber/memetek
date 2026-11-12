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

-- ═══════════════════════════════════════════
-- RPC: Airdrop Stats & Spots Remaining
-- ═══════════════════════════════════════════
CREATE OR REPLACE FUNCTION get_airdrop_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  tg_count integer;
  rd_count integer;
BEGIN
  SELECT count(*) INTO tg_count FROM telegram_airdrop;
  SELECT count(*) INTO rd_count FROM random_airdrop;
  RETURN json_build_object(
    'telegram_total', 50,
    'telegram_taken', tg_count,
    'telegram_remaining', GREATEST(0, 50 - tg_count),
    'random_total', 1000,
    'random_taken', rd_count,
    'random_remaining', GREATEST(0, 1000 - rd_count)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_airdrop_stats() TO anon, authenticated;

-- ═══════════════════════════════════════════
-- ENFORCE CAPS VIA TRIGGERS (50 and 1000)
-- ═══════════════════════════════════════════
CREATE OR REPLACE FUNCTION enforce_telegram_airdrop_cap()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF (SELECT count(*) FROM telegram_airdrop) >= 50 THEN
    RAISE EXCEPTION 'AIRDROP_FULL: All 50 spots have been claimed.'
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_enforce_telegram_cap'
  ) THEN
    CREATE TRIGGER trg_enforce_telegram_cap
      BEFORE INSERT ON telegram_airdrop
      FOR EACH ROW
      EXECUTE FUNCTION enforce_telegram_airdrop_cap();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION enforce_random_airdrop_cap()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF (SELECT count(*) FROM random_airdrop) >= 1000 THEN
    RAISE EXCEPTION 'AIRDROP_FULL: All 1,000 spots have been claimed.'
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_enforce_random_cap'
  ) THEN
    CREATE TRIGGER trg_enforce_random_cap
      BEFORE INSERT ON random_airdrop
      FOR EACH ROW
      EXECUTE FUNCTION enforce_random_airdrop_cap();
  END IF;
END $$;
