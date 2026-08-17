-- Enum type definitions
--
-- All enum types used across the schema:
--   question_type   - question answer value types
--   entity_type     - nomination entity discriminator
--   category_type   - question category classification
--   user_role_type  - auth role assignments

CREATE TYPE public.question_type AS ENUM (
    'text', 'number', 'boolean', 'image', 'date', 'multipleText',
    'singleChoiceOrdinal',
    'singleChoiceCategorical',
    'multipleChoiceCategorical'
);

CREATE TYPE public.entity_type AS ENUM (
    'candidate', 'organization', 'faction', 'alliance'
);

CREATE TYPE public.category_type AS ENUM (
    'info', 'opinion', 'default'
);

CREATE TYPE public.user_role_type AS ENUM (
    'candidate', 'party', 'project_admin', 'account_admin', 'super_admin'
);
