# Maintenance scripts

These are **not** migrations. They are one-off operational scripts that are run
by hand, deliberately, against a specific database.

`20260310_cleanup_data.sql` lived in `supabase/migrations/` and `TRUNCATE ...
CASCADE`s every application table. Running the migration folder from scratch
against a database with real data would have destroyed it. Nothing here is
safe to run as part of an automated migration pass.
