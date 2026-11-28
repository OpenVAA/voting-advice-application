No external API integration: the Playwright entry reads the app's own `/api/health` and `/`; the runbook calls the Supabase Auth Admin API once by hand to create one account.
