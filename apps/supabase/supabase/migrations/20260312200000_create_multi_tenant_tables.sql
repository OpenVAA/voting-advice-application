-- Migration: Create multi-tenant foundation tables
-- Phase 9 Plan 01 Task 1
--
-- Creates the accounts and projects tables that form the multi-tenant
-- hierarchy. All content tables reference projects via project_id FK.

-- accounts: top-level tenant (organization)
CREATE TABLE accounts (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  created_at timestamptz NOT NULL    DEFAULT now(),
  updated_at timestamptz NOT NULL    DEFAULT now()
);

-- projects: a single VAA deployment belonging to an account
CREATE TABLE projects (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id     uuid        NOT NULL REFERENCES accounts(id),
  name           text        NOT NULL,
  default_locale text        NOT NULL DEFAULT 'en',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
