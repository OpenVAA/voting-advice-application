-- Migration: Create localization functions and updated_at trigger
-- Phase 9 Plan 01 Task 1
--
-- Provides:
--   update_updated_at()  -- trigger function that sets updated_at = now()
--   get_localized()      -- extracts a locale string from a JSONB locale object
--                           with fallback: requested -> default -> first key

--------------------------------------------------------------------------------
-- Trigger function: automatically set updated_at on row update
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- Localization function: extract locale string from JSONB with fallback chain
--
--   val            -- JSONB object like {"en": "Hello", "fi": "Moi"}
--   locale         -- requested locale code (e.g. 'fi')
--   default_locale -- project default locale for fallback (e.g. 'en')
--
-- Fallback order:
--   1. val->>locale          (requested locale)
--   2. val->>default_locale  (project default)
--   3. first available key   (any content is better than NULL)
--   4. NULL                  (val is NULL or empty)
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_localized(
  val            jsonb,
  locale         text,
  default_locale text DEFAULT 'en'
)
RETURNS text
LANGUAGE plpgsql IMMUTABLE
AS $$
BEGIN
  -- NULL input -> NULL output
  IF val IS NULL THEN
    RETURN NULL;
  END IF;

  -- Try requested locale
  IF val ? locale THEN
    RETURN val ->> locale;
  END IF;

  -- Fall back to default locale
  IF val ? default_locale THEN
    RETURN val ->> default_locale;
  END IF;

  -- Fall back to first available key
  RETURN (SELECT val ->> k FROM jsonb_object_keys(val) AS k LIMIT 1);
END;
$$;

--------------------------------------------------------------------------------
-- Apply updated_at triggers to multi-tenant tables
--------------------------------------------------------------------------------
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
