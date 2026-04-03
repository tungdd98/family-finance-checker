# Supabase CLI Migration Workflow

**Date:** 2026-04-02
**Status:** Approved

## Problem

Previously, database migrations were written as SQL files in `docs/` and required manual execution through the Supabase dashboard. This created friction and risk of human error.

## Goal

Enable Claude to automatically run database migrations against the Supabase project via Supabase CLI, both on-demand and automatically when new migration files are created.

## Approach

Supabase CLI linked to the cloud project, with a CLAUDE.md rule to auto-push after creating migrations.

## Setup (one-time)

1. Install Supabase CLI: `brew install supabase/tap/supabase`
2. Add to `.env.local` (not committed):
   ```
   SUPABASE_ACCESS_TOKEN=sbp_xxxxx
   SUPABASE_PROJECT_REF=planeljrbapkxdzbtjzm
   ```
3. Run `supabase link --project-ref planeljrbapkxdzbtjzm` to link CLI to the project

## Migration Workflow

When a database migration is needed:

1. Create migration file: `supabase migration new <name>` → generates `supabase/migrations/YYYYMMDDHHMMSS_<name>.sql`
2. Write SQL into the generated file
3. Push immediately: `supabase db push --linked`
4. Report result to user

## File Structure

```
family-finance-tracker/
├── supabase/
│   └── migrations/
│       └── YYYYMMDDHHMMSS_name.sql   ← all new migrations go here
├── docs/
│   └── *.sql                         ← legacy files, kept as-is
```

## CLAUDE.md Rule

> After creating a new migration file in `supabase/migrations/`, always run `supabase db push --linked` immediately and report the result.

## Out of Scope

- Migrating legacy `docs/*.sql` files into the new system (they are kept as historical reference only)
- Local database development (no `supabase start` / local Docker setup)
- Rollback tooling (handled manually if needed)
