-- Localized views for voter-facing queries
--
-- Resolve JSONB locale columns to plain text strings via get_localized().
--
-- Set the locale before querying:
--   SELECT set_config('app.locale', 'fi', TRUE);
--   SELECT * FROM elections_localized;

CREATE OR REPLACE VIEW elections_localized AS
SELECT
  id,
  project_id,
  get_localized(name, current_setting('app.locale', TRUE),
    (SELECT default_locale FROM projects WHERE id = elections.project_id)) AS name,
  get_localized(short_name, current_setting('app.locale', TRUE),
    (SELECT default_locale FROM projects WHERE id = elections.project_id)) AS short_name,
  get_localized(info, current_setting('app.locale', TRUE),
    (SELECT default_locale FROM projects WHERE id = elections.project_id)) AS info,
  election_date,
  election_start_date,
  election_type,
  multiple_rounds,
  current_round,
  sort_order
FROM elections;

CREATE OR REPLACE VIEW questions_localized AS
SELECT
  id,
  project_id,
  get_localized(name, current_setting('app.locale', TRUE),
    (SELECT default_locale FROM projects WHERE id = questions.project_id)) AS name,
  get_localized(info, current_setting('app.locale', TRUE),
    (SELECT default_locale FROM projects WHERE id = questions.project_id)) AS info,
  type,
  category_id,
  choices,
  settings,
  election_ids,
  constituency_ids,
  entity_type,
  allow_open,
  required,
  sort_order
FROM questions;
