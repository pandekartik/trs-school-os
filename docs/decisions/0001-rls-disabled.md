# RLS is intentionally disabled

**Status:** Accepted · 2026-07-20

Row Level Security is disabled on all tables in `public` on both `trs-prod`
and `trs-dev`. This is a reviewed decision, not an oversight — the Supabase
security advisor will keep flagging it (`rls_disabled_in_public`,
`policy_exists_rls_disabled`) and that's expected.

## Why

- All authorization is enforced server-side, in Next.js server actions and
  API routes, gated by `getRole()` / `getTeacherProfile()` (see `lib/auth.ts`
  and `lib/role-access.ts`).
- Most write paths (`lib/actions/timetable.ts`, most of `app/api/**`) already
  use the service-role admin client (`lib/supabase-admin.ts`), which bypasses
  RLS regardless of table-level policy state.
- A subset of actions (`lib/actions/admin.ts`, `setup.tsx`, `content.ts`,
  `teacher.ts`) use the session-scoped anon client (`lib/supabase-server.ts`),
  which *would* be subject to RLS if it were enabled.
- RLS was previously enabled (`012_implement_rls_policies.sql`), hit a
  recursion bug on the `teacher` table (`013_fix_teacher_rls_recursion.sql`),
  and was disabled fleet-wide shortly after (`014_disable_all_rls.sql`).
  The old policies from `012` are still present in the database (inert,
  since RLS is off) — that's why the advisor also flags
  `policy_exists_rls_disabled` alongside `rls_disabled_in_public`.

## Consequence

If the Supabase anon or service-role key is ever exposed client-side beyond
what's intended, there is **no database-level backstop** — every table is
readable/writable via PostgREST by anyone holding a valid key. The app's
entire security model rests on server-side checks never being bypassed.

## Revisiting this

A real RLS rollout needs, at minimum:
- Rewriting the `012` policies (they predate branch scoping, leave
  management, and the current role set) and dropping the dead ones.
- Deciding whether the admin-client action files should move to the
  session-scoped client + policies, or stay on the service-role client
  (in which case RLS would only protect the four files that don't).
- Table-by-table re-enablement with regression testing, not a single
  fleet-wide flip — the `013` recursion bug shows this failed once already.

This is tracked as a follow-up, not committed to a timeline here.
