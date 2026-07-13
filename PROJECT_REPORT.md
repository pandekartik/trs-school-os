# TRS School OS — Project Audit Report

**Generated:** 2026-07-13 · **Scope:** Read-only audit (git history, codebase scan, `trs-prod` database scan, known-bug verification, feature completion matrix, roadmap). No code was modified, no migrations were run.

**Branch audited (working tree):** `claude/project-audit-report-71xks5`, which is based on `origin/main` @ `24124fc`. Where a feature exists **only** on the stale `dev` branch, this is called out explicitly — it is not present in what's actually deployable from `main`.

---

## Section 1 — Git History

### Branches
```
* claude/project-audit-report-71xks5  (HEAD, = origin/main @ 24124fc)
  main                                 56 commits, last commit 2026-06-30
  dev                                  25 commits, last commit 2026-06-11 — STALE
  content_bug                          fully merged into main (0 commits ahead)
  content_sequential_fetch             fully merged into main (0 commits ahead)
  hotfix/content-upload-bugs           1 commit NOT merged into main
```

### `dev` vs `main`
- `dev` diverged from `main` at `555f70c` (~2026-06-08) and has received exactly **one commit since**: `6fbc3b0 feat: leave management system with approval workflow, substitution assignment, and pending actions dashboard`.
- Meanwhile `main` has received **32 additional commits** that `dev` does not have (timetable UI redesign, teacher attendance, period overrides, display IDs, branch management phases 2–4, various fixes).
- **Consequence:** `dev` is not a usable staging branch for anything except the leave-management UI. Merging it into `main` today would conflict heavily, and the leave-management feature it adds has **no corresponding database migration** anywhere in the repo (confirmed in Section 3 — `leave_request`, `leave_policy`, `leave_balance`, `substitution` tables do not exist in `trs-prod`, and no `migrations/*.sql` or `supabase/migrations/*.sql` file creates them).

### Unmerged hotfix
- `hotfix/content-upload-bugs` (1 commit, `15949a3`, 2026-06-13, not merged into `main`): "fix: resolve content upload display and audit logging issues" — fixes soft-deleted `chapter_period` rows leaking into the UI, empty `uploaded_by`, and missing audit-log entries on upload. Touches `app/(dashboard)/content/page.tsx` and `app/api/upload-lesson-plan/route.ts`. **This fix is not live** unless it was independently cherry-picked into `main` — worth confirming before assuming these bugs are fixed (they weren't in scope of the BUG-00x checks below, which only covered the 9 specified issues).

### Notable commit themes on `main` (from `git log --oneline --all`, most recent first)
- Content lazy-loading rework (`76c75bc`) — fixes BUG-002 (see Section 4)
- Windows-incompatible `loading.tsx` paths removed (`596767e`) — **net effect: zero `loading.tsx` files exist on `main` today** (see Section 5/6)
- Meaningful display-ID system for periods/slots (`0d7a5d0`, `36f5fcc`, `bc80258`)
- Teacher attendance + period override system (`05d7536`, `684b1fd`, `99e5e6e`)
- Timetable UI rebuilt with table+panel pattern (`bb1f129`)
- **Branch context and filtering explicitly removed** (`e701d64 feat: remove branch selector and branch-based filtering`) — directly relevant to the branch_id follow-up request (see the note at the end of this report)
- A long, visible thrash cycle around `display_id` field access (`8d89251` → `6d57a49` → `dd64fd0` → `2338313` → `5211fcc` → `e044201` → `a17caf2`, all same day) — suggests `select(*)` vs explicit-column-selection vs admin-client-vs-anon-client issues were being fought live in production; worth a retro but not an open bug today.
- `effective_periods` formula and `display_order` insert issues patched twice (`c67145c`, plus prod-only migrations `fix_effective_periods_column_defaults` and `fix_display_order_column_defaults` — see Section 3) — but see BUG-006 in Section 4, the *application code* was never fixed, only the DB defaults.

---

## Section 2 — Codebase Scan (file/function existence)

*(Scanned against the current working tree = `main`. "dev-only" = confirmed to exist in the `dev` branch's diff but not on `main`.)*

### Auth — all present
- ✅ `app/(auth)/sign-in/[[...sign-in]]/page.tsx`
- ✅ `app/(auth)/reset-password/page.tsx`
- ✅ `app/(auth)/sign-up/[[...sign-up]]/page.tsx`

### Setup
| Item | Status |
|---|---|
| School Year (page + `school-year-tab.tsx`) | ✅ EXISTS |
| Standards (page + `standards-tab.tsx`) | ✅ EXISTS |
| Segments (page + `segments-tab.tsx`) | ✅ EXISTS |
| Subjects (page + `subjects-tab.tsx`) | ✅ EXISTS |
| Teachers (page + `teachers-shell.tsx`) | ✅ EXISTS |
| Chapters (page + `chapters-tab.tsx`) | ✅ EXISTS |
| Teacher Allocation (page + `assignments-tab.tsx`) | ✅ EXISTS |
| Branches | ⚠️ At `app/(dashboard)/admin/branches/page.tsx`, **not** `setup/branches/page.tsx`. `components/setup/branches-shell.tsx` exists. |
| Leave Policy | ❌ MISSING — no route, component, action, or DB table anywhere in the repo (main or dev) |

### Timetable — all present
- ✅ Templates: page, `time-templates-shell.tsx`, `template-wizard.tsx`, `template-slot-editor.tsx`
- ✅ Builder: `app/(dashboard)/timetable/page.tsx` **and** `app/(dashboard)/timetable/builder/page.tsx` both exist (duplicate entry points — see Section 6); `timetable-shell.tsx`, `timetable-panel.tsx`, `timetable-grid.tsx`, `slot-popover.tsx`, `finalize-modal.tsx`
- ✅ Holidays: page, `holidays-shell.tsx` (list view works; **calendar view is a UI stub** — literal text "Calendar view coming soon", `components/timetable/holidays-shell.tsx:408`)

### Content — all present
✅ `content/page.tsx`, `content-shell.tsx`, `upload-panel.tsx`, `chapter-status-row.tsx`

### Teacher
| Item | Status |
|---|---|
| `teacher-shell.tsx`, `week-view.tsx`, `period-card.tsx`, `log-modal.tsx`, `override-modal.tsx` | ✅ EXISTS |
| `absence-panel.tsx` | ⚠️ Named differently: `absence-drawer.tsx` exists and covers this |
| Attendance page + `attendance-shell.tsx` | ✅ EXISTS |
| Leave page, `leave-shell.tsx`, `leave-apply-panel.tsx`, `substitution-panel.tsx` | ❌ MISSING on `main`. dev-only. No DB table backs any of it even on `dev`. |

### Admin
| Item | Status |
|---|---|
| Dashboard, `dashboard-shell.tsx`, `stat-card.tsx`, `flagged-periods.tsx`, `chapter-progress.tsx`, `teacher-table.tsx` | ✅ EXISTS |
| `pending-actions.tsx` | ❌ MISSING on `main` (dev-only, and depends on the missing leave_request table) |
| Users page, `users-shell.tsx`, `user-panel.tsx` | ✅ EXISTS |
| Activity page, `activity-shell.tsx` | ✅ EXISTS (includes working CSV export, `activity-shell.tsx:145-160`) |

### API routes
| Route | Status |
|---|---|
| `/api/health` | ✅ EXISTS (minimal — returns status/timestamp only, no DB connectivity check) |
| `/api/upload-lesson-plan` | ✅ EXISTS |
| `/api/admin/set-password` | ✅ EXISTS |
| `/api/admin/invite-user` | ✅ EXISTS |
| `/api/set-branch` | ❌ MISSING |
| `/api/audit/auth` | ✅ EXISTS |
| Extra (not in original spec) | `/api/admin/update-user`, `/api/period-overrides`, `/api/period-overrides/[id]` |

### `lib/actions/setup.tsx` (note: `.tsx`, not `.ts`)
✅ All 27 requested CRUD functions present **except**: ❌ `createLeavePolicy`, `updateLeavePolicy`, `deleteLeavePolicy` (missing — no leave-policy feature at all).

### `lib/actions/timetable.ts`
✅ All present **except**: ❌ `generatePeriodInstances` — closest analog is a differently-named `generateSchedule`, not a drop-in match. This matters: **`period_instance` has 0 rows in prod** despite 571 chapters and 2,119 uploaded lesson-plan files — the finalize → period-generation pipeline does not appear to be wired end-to-end (see Section 3/6).

### `lib/actions/teacher.ts`
✅ `logPeriod`, `markAbsence`, `deleteAbsence`, `markAttendance`, `bulkMarkAttendance`, `deleteAttendance`
❌ MISSING entirely: `applyForLeave`, `cancelLeaveRequest`, `approveLeaveRequest`, `rejectLeaveRequest`, `getSuggestedSubstitute`, `assignSubstitution`, `handleAbsentPeriod`

### `lib/actions/admin.ts`
✅ `refreshDashboard`, `flagUnloggedPeriods`

### `lib/audit.ts`
✅ `writeAuditLog` exists (1,081 rows in prod `audit_log`, so it's actively used). **Cleanup item:** a stray duplicate file `lib/audit 2.ts` also exists in the repo (near-identical, 92 vs 95 lines) — looks like an accidental artifact.

### `lib/auth.ts`
✅ `getSession`, `getUser`, `getTeacherProfile`, `getRole`
❌ `getActiveBranch` — **does not exist**. Confirmed independently: no reference anywhere in the codebase.

### `lib/utils/auto-sequence.ts`
✅ `getChapterPeriodForSlot` exists (satisfies the "or" requirement).

### `lib/utils/date.ts`
❌ **File does not exist at all.** No `parseDateOnly`/`formatDateOnly` anywhere in the repo. This directly confirms BUG-003 (Section 4) is still present.

### `lib/actions/content.ts`
✅ Exists, single export `getChapterContent(chapterId)` — the per-chapter lazy-load action that fixed BUG-002.

### Types (`lib/types/index.ts`)
✅ All present **except**: ❌ `LeavePolicy`, `LeaveRequest`, `Substitution` (consistent with the missing feature).

### Migrations
- `migrations/` — 17 files present, numbered 001–018 with **012 confirmed missing/skipped** (jumps 011 → 013).
- `supabase/migrations/` — a **second, parallel migration folder** exists with 6 differently-named files (`20260518000000_role_cleanup.sql`, `20260525000000_timetable_builder.sql`, `20260526000000_fix_template_fk.sql`, `20260526000001_create_template_slot.sql`, `20260526000002_fix_day_of_week_check.sql`, `20260608000000_timetable_ui_redesign.sql`). This is confirmed to exist in the current `main`-based working tree, not just on `dev`.
- Production's actual applied-migration history (from `list_migrations` against `trs-prod`) shows a **third naming scheme** entirely — timestamped versions like `20260528080139_012_implement_rls_policies` and ad-hoc names like `fix_effective_periods_column_defaults`, `period_override`, `add_display_ids` that don't map 1:1 to either local folder. **Three divergent sources of truth for schema history is a real production-readiness risk** — see Section 6.

### Sidebar (`components/layout/app-sidebar.tsx`)
16 of 19 expected items present (Branches present, but grouped under **ADMIN** rather than **SETUP** as the spec implied — functionally fine, just a different information-architecture choice). **Missing:** Leave Policy, Leave Requests (both nav items absent, consistent with the missing feature).

### File count
**179 files** total (excl. `node_modules`, `.next`, `.git`): `app/` 36, `components/` 78, `lib/` 18, `migrations/` 17, `supabase/migrations/` 6, root config/docs 13, remainder in `public/`/misc.

---

## Section 3 — `trs-prod` Database Scan (project `cwpmyepytcjyaouuelyc`)

### Tables & row counts
| Table | Rows | | Table | Rows |
|---|---|---|---|---|
| academic_segment | 39 | | subject | 62 |
| audit_log | 1,081 | | teacher | 6 |
| branch | 1 | | teacher_absence | 0 |
| chapter | 571 | | teacher_assignment | 0 |
| chapter_mcq | 0 | | teacher_attendance | 0 |
| chapter_period | 2,119 | | template_slot | 0 |
| chapter_test | 0 | | time_template | 0 |
| coverage_summary | 0 | | timetable | 0 |
| division | 1 | | timetable_activation | 0 |
| division_template | 0 | | timetable_day_template | 0 |
| holiday | 6 | | timetable_division | 0 |
| period_instance | **0** | | timetable_slot | 0 |
| period_override | 0 | | school_year | 1 |
| standard | 10 | | schema_migrations | 21 (see note) |

**Note on `schema_migrations`:** the row-count query returned 4 conflicting counts (78/21/77/9) for this one table due to a `pg_stat_user_tables` join artifact (stale/multiple stat entries); treat as noise, not a real anomaly. `list_migrations` (the authoritative source) shows **21 applied migrations**.

**Key finding:** Every timetable-related and attendance-related table is **empty** in production (`timetable`, `timetable_slot`, `time_template`, `template_slot`, `timetable_activation`, `timetable_division`, `timetable_day_template`, `teacher_attendance`, `teacher_absence`, `teacher_assignment`, `period_instance`, `period_override` — all 0 rows), despite 571 chapters and 2,119 uploaded lesson plans existing. **The system currently only has real data for the content/setup side (school year, standards, subjects, chapters, lesson plans) — nothing on the scheduling/attendance/timetable side has ever been used in production.**

### Tables expected in code but absent from prod
`leave_request`, `leave_policy`, `leave_balance`, `substitution` — confirmed absent via `to_regclass()` (all returned `null`). `chapter_mcq` and `chapter_test` **do** exist (contrary to a literal reading of the expected-missing list) but have 0 rows.

### RLS status
**RLS is disabled on all 27 tables in `public`**, matching migration `014_disable_all_rls.sql` and commit `9adba37`. The Supabase security advisor flags this as **19 separate ERROR-level findings** (`rls_disabled_in_public` + `policy_exists_rls_disabled` — meaning old RLS *policies* from migration `012_implement_rls_policies` were never dropped, they're just inert because RLS itself is off). Additional advisor findings:
- `rls_auto_enable()` is a `SECURITY DEFINER` function callable by both `anon` and `authenticated` roles via `/rest/v1/rpc/rls_auto_enable` — unintended public RPC exposure.
- 8 `generate_*_display_id` trigger functions have a mutable `search_path` (minor hardening item).
- Leaked-password protection is disabled in Supabase Auth.

### Indexes / triggers / functions
- Indexes are present and reasonably comprehensive — every FK-ish column and `display_id` has a supporting index; no glaring gaps found.
- Triggers exist only for `display_id` auto-generation on INSERT (`academic_segment`, `branch`, `chapter`, `division`, `school_year`, `standard`, `subject`, `teacher`). **No trigger exists for `period_instance` or `timetable_slot` display IDs** — those must be computed at the application layer during generation.
- No DB trigger writes to `audit_log` — all audit logging is application-layer only (`writeAuditLog`), consistent with the codebase scan.

### `branch_id` / column presence check (relevant to the follow-up DB-fix request below)
| Table | `branch_id`? |
|---|---|
| `teacher` | ✅ yes |
| `teacher_assignment` | ✅ yes |
| `holiday` | ✅ yes |
| `time_template` | ✅ yes |
| `timetable` | ✅ yes |
| `timetable_slot` | ✅ yes |
| `timetable_activation` | ✅ yes |
| `period_instance` | ❌ **no** |
| `teacher_attendance` | ❌ **no** |
| `leave_request` | N/A — table doesn't exist |
| `substitution` | N/A — table doesn't exist |
| `audit_log` | ❌ **no** |

### Data health check
active_years=1, active_teachers=6, total_chapters=571, uploaded_files=2,119, published_files=2,066, holidays=6, period_instances=**0**, branches=1.

---

## Section 4 — Known Bugs (verified by direct code read, not inference)

| ID | Status | Evidence |
|---|---|---|
| **BUG-001** — Content page uses `effective_periods` instead of `allocated_periods` | ✅ **FIXED** | `upload-panel.tsx:197` — `Array.from({ length: chapter.allocated_periods }, ...)`. `effective_periods` only appears in a display badge (line 174). |
| **BUG-002** — `chapter_period` fetched globally, pagination-limited | ✅ **FIXED** | `content/page.tsx` no longer touches `chapter_period`; per-chapter lazy load via `lib/actions/content.ts:19` on selection (`content-shell.tsx:208`). Confirmed by commit `76c75bc`. |
| **BUG-003** — Holiday dates off-by-one-day (timezone parsing) | ❌ **STILL PRESENT** | `lib/utils/date.ts` doesn't exist. `holidays-shell.tsx` uses raw `new Date(dateString)` at lines 106, 345, 396. |
| **BUG-004** — Sidebar active-state wrong on `/admin/users`, `/admin/activity` | ✅ **FIXED** | `app-sidebar.tsx:122-137`, `isActivePath()` explicitly excludes `/admin`, `/timetable`, `/teacher` from prefix-matching. |
| **BUG-005** — Setup insert actions throw column-mismatch errors | ⚠️ **PARTIALLY FIXED / root cause reframed** | `createSchoolYear`/`createStandard`/`createDivision` insert objects match their DB schemas exactly — no issue. The real historical culprit was `createChapter`/`updateChapter` **never setting** `effective_periods`/`display_order` at all (not sending extra fields, but omitting required ones) — this was patched at the **DB layer** via `ALTER COLUMN ... SET DEFAULT` migrations (confirmed live: both columns are now `nullable=YES, default=0`), not in application code. |
| **BUG-006** — `effective_periods` formula wrong (floor·0.8 vs ceil·1.3) | ⚠️ **STILL PRESENT (latent)** | The correct formula (`Math.ceil(allocated * 1.3)`) exists **only** as a client-side display helper in `chapters-tab.tsx:26-29` — it is never sent to the server. `createChapter`/`updateChapter` never set `chapter.effective_periods` at all. **Verified against live data:** all 571 existing chapters happen to have the mathematically-correct value — this was fixed via a one-time backfill migration, not app code. **Any chapter created or edited through the UI from now on will silently get `effective_periods = 0`** (the column default), which then feeds wrong values into `auto-sequence.ts:38` and `timetable.ts:540`. This is a live landmine, not resolved. |
| **BUG-007** — Admin should see all uploads, teacher only published | ✅ **FIXED** | Achieved via component separation rather than in-line role checks: `upload-panel.tsx` (admin/coordinator-only page) renders all periods regardless of `is_published` with a "Draft" badge; `period-card.tsx:206` (teacher-facing) requires `is_published && lesson_plan_url` to show the plan button. |
| **BUG-008** — Period card border colors not applying | ✅ **FIXED** | `period-card.tsx:66-110` — status→color mapping is wired to a real inline style (`borderLeft`), not dead code. |
| **BUG-009** — Log modal doesn't prefill on edit | ✅ **FIXED** | `log-modal.tsx:66-75` — `useEffect` on `open` correctly seeds `status` and `coverageNote` from `periodInstance`. |

**Net: 6 of 9 fixed, 1 partially-fixed-with-a-caveat (BUG-005), 2 still open (BUG-003, BUG-006).** BUG-006 in particular is a silent data-correctness bug that will start corrupting new data the moment anyone creates a chapter through the current UI.

---

## Section 5 — Feature Completion Matrix

Legend: ✅ COMPLETE · 🟡 PARTIAL · ❌ MISSING

| Feature | Status | Detail |
|---|---|---|
| Role system (super_admin/admin/coordinator/teacher) | ✅ | `teacher.role`, `role-access.ts`, middleware all wired |
| Branch management (CRUD) | 🟡 | CRUD actions + `branches-shell.tsx` exist at `admin/branches`, not `setup/branches`. `branch_id` present on most operational tables but missing on `period_instance`, `teacher_attendance`, `audit_log`. |
| Branch **context/filtering** (active-branch switcher, `getActiveBranch()`, query scoping) | ❌ | Explicitly removed by commit `e701d64`; no `getActiveBranch()`, no `/api/set-branch`, no switcher UI exist today |
| Auth (sign in / reset / invite-only) | ✅ | All 3 routes present |
| Setup: School Year | ✅ | |
| Setup: Standards & Divisions | ✅ | |
| Setup: Segments (quick create) | ✅ | |
| Setup: Subjects | ✅ | |
| Setup: Teachers | ✅ | |
| Setup: Chapters (3-col selector, inline edit) | 🟡 | UI complete; `effective_periods` never computed on create/update (BUG-006) |
| Setup: Teacher Allocation | ✅ | |
| Setup: Leave Policy | ❌ | No route/component/action/table anywhere |
| Time Templates wizard | ✅ | |
| Time Templates slot view/edit | ✅ | |
| Timetable Builder UI | 🟡 | Two competing entry points exist (`/timetable` and `/timetable/builder`) — unclear which is canonical |
| Timetable: day-wise template per division | ✅ | |
| Timetable: slot grid w/ subject+teacher | ✅ | |
| Timetable: finalize w/ preflight checklist | ✅ | `getPreflightCheck` action exists |
| Timetable: draft/finalize cycle | ✅ | |
| Timetable: PDF export | ❌ | No PDF library or export code found anywhere in the repo |
| Holidays: list view | ✅ | |
| Holidays: calendar view | ❌ | UI stub only — "Calendar view coming soon" |
| Holidays: scope (all/standard/division) | ✅ | Schema + UI support it |
| Content: chapter list w/ status/filters | ✅ | |
| Content: upload panel w/ publish toggle | ✅ | |
| Content: MCQ/test JSON editors | 🟡 | Code exists (`saveMcq`/`saveTest`, tables exist) but **0 rows in prod** — never actually used |
| Content: fetch per-chapter, not global | ✅ | BUG-002 fixed |
| Teacher View: week grid | ✅ | |
| Teacher View: auto-sequence | 🟡 | Function exists but depends on `effective_periods`, which is broken for new chapters (BUG-006) |
| Teacher View: log period modal | ✅ | |
| Teacher View: "different content" override in log modal | 🟡 | A separate `override-modal.tsx` exists for period overrides; not confirmed as an in-modal option inside `log-modal.tsx` itself |
| Teacher View: view lesson plan button | ✅ | |
| Teacher View: mobile responsive | 🟡 | Not verified in this audit — recommend manual device testing |
| Attendance: mark present/absent/late/half_day | ✅ | |
| Attendance: monthly calendar view | 🟡 | `today-summary.tsx`/`attendance-modal.tsx` exist; dedicated monthly calendar not confirmed |
| Attendance: admin bulk mark | ✅ | |
| Attendance: period handling for absent teachers | 🟡 | `markAbsence` exists; the specific `handleAbsentPeriod` automation function is missing |
| Leave: apply / balance / approve-reject / substitution panel / auto-suggest / substitute visibility | ❌ | Entire feature missing on `main`; exists as unmigrated UI-only code on stale `dev` branch with **zero DB backing anywhere** |
| Period Instance: generation on finalize | 🟡 | `generatePeriodInstances` action missing (only a differently-shaped `generateSchedule` exists); **0 rows in prod** confirms this pipeline has never successfully run end-to-end |
| Period Instance: meaningful display IDs | 🟡 | Schema/index support confirmed; cannot verify actual ID format live since table is empty |
| Period Override: substitute / cancel / chapter remap | ✅ | Schema + `savePeriodOverride`/`deletePeriodOverride` support all three override types |
| Period Override: affects auto-sequence | 🟡 | Plausible from code shape, not independently traced end-to-end in this audit |
| Admin Dashboard: stat cards, flagged periods, teacher table, chapter progress | ✅ | |
| Admin Dashboard: pending leave-requests banner | ❌ | Component missing on `main`; depends on missing leave feature |
| Admin Users: table, add-user, set-password, role badges | ✅ | |
| Activity Log: `audit_log` table + triggers | 🟡 | Table exists and is actively used (1,081 rows); **no DB triggers** — 100% application-layer logging via `writeAuditLog` |
| Activity Log: `writeAuditLog` wired everywhere | 🟡 | Confirmed in heavy use; full coverage across every action not individually traced |
| Activity Log: UI filters/expand/CSV export | ✅ | CSV export confirmed working (`activity-shell.tsx:145`) |
| Loaders: `loading.tsx` per route | ❌ | **Zero** `loading.tsx` files exist on `main` — a commit (`596767e`) removed all of them as "Windows-incompatible" and they were never re-added in a working form. 14 exist on the stale `dev` branch only. |
| Loaders: button spinners on forms | 🟡 | Not exhaustively traced |
| Display IDs on all entities | 🟡 | Present + trigger-backed for `branch`, `chapter`, `division`, `school_year`, `standard`, `subject`, `teacher`, `academic_segment`. **Absent** on `chapter_period`, `holiday`, `teacher_attendance`, `teacher_assignment`, `timetable_division`, `timetable_day_template`, `period_override`, `division_template`, `coverage_summary`, `chapter_mcq`, `chapter_test` |
| Display IDs: meaningful period IDs | 🟡 | Columns/indexes exist (`period_instance.display_id`, `timetable_slot.display_id`); unverifiable live (0 rows) |
| Soft deletes (`deleted_at`) on critical tables | 🟡 | Present on 7 of ~27 tables (`academic_segment`, `chapter`, `chapter_period`, `division`, `standard`, `subject`, `teacher_assignment`, `timetable_slot`); **absent** on `teacher`, `branch`, `holiday`, `period_instance`, `period_override`, `teacher_attendance`, `teacher_absence`, `timetable`, and others |
| Date utility (`parseDateOnly`/`formatDateOnly`) | ❌ | File doesn't exist (BUG-003) |
| Health route | 🟡 | Exists but only checks process liveness, not DB connectivity |
| Migrations folder(s) | 🟡 | **Three divergent schema-history sources**: `migrations/` (18 files, gap at 012), `supabase/migrations/` (6 files, different naming), and prod's actual `schema_migrations` table (21 entries, a third naming scheme) |
| Dev/Prod separation | 🟡 | Two Supabase projects confirmed (`trs-prod` ACTIVE_HEALTHY, `trs-dev` **currently INACTIVE/paused**); two git branches exist but `dev` is 3+ weeks stale and diverged; two-Vercel-project claim not verified in this session |

**Tally: 32 COMPLETE / 21 PARTIAL / 9 MISSING out of 62 distinct rows** ≈ **52% complete, 34% partial, 14% missing.**

---

## Section 6 — Prioritised Remaining Work

`PRIORITY | TASK | EFFORT | DEPENDS_ON`

### Bugs
- P0 | Fix BUG-006: make `createChapter`/`updateChapter` actually compute and persist `effective_periods = Math.ceil(allocated_periods * 1.3)` server-side | S | —
- P0 | Fix BUG-003: create `lib/utils/date.ts` with `parseDateOnly`/`formatDateOnly` and use them in `holidays-shell.tsx` (and audit any other raw `new Date(dateString)` on date-only strings) | S | —
- P1 | Verify hotfix branch `hotfix/content-upload-bugs` (soft-delete leakage, empty `uploaded_by`, missing audit logs on upload) is actually merged into `main` — it currently is not | S | —
- P2 | Clean up stray duplicate `lib/audit 2.ts` | S | —

### Features partially built needing completion
- P0 | Wire up `generatePeriodInstances` end-to-end so finalizing a timetable actually populates `period_instance` (currently 0 rows in prod despite full downstream UI existing) | M | Timetable Builder finalize flow
- P1 | Decide and consolidate on one Timetable Builder entry point (`/timetable` vs `/timetable/builder`) | S | —
- P1 | Build real Holidays calendar view (currently a "coming soon" stub) | M | —
- P2 | Add `handleAbsentPeriod` automation so marking a teacher absent actually surfaces/reassigns their periods | M | period_instance generation (above)
- P2 | Reintroduce `loading.tsx` skeletons on `main` in a Windows-safe way (the parenthesized-route-group path issue that caused their removal needs a real fix, not deletion) | S | —

### Features completely missing
- P1 | Leave Policy setup (Setup page/actions/types) — needed before Leave Requests can function at all | M | —
- P1 | Leave Requests feature (apply/balance/approve/reject/substitution/auto-suggest) — full DB schema + app work; the `dev` branch's UI/actions can be salvaged but need a real migration written from scratch and a rebase onto current `main` (32 commits behind) | L | Leave Policy, DB migration below
- P2 | Timetable PDF export | M | —
- P2 | Admin Dashboard pending-leave-requests banner | S | Leave Requests feature

### DB migrations missing from prod
- P0 | Create `leave_policy`, `leave_request`, `leave_balance`, `substitution` tables (none exist today, despite `dev` branch code assuming they do) | M | Leave feature design confirmation
- P1 | Add `branch_id` to `period_instance`, `teacher_attendance`, and `audit_log` if branch-scoping is being reintroduced (see note below on the DB-fix request in this task) | S | Decision on whether branch filtering is coming back (it was deliberately removed in `e701d64`)
- P2 | Add `display_id` to the ~11 tables that lack one, for consistency | S | —
- P2 | Add `deleted_at`/`deleted_by` to the ~19 tables that lack soft-delete support, if that's meant to be universal policy | M | —
- P3 | Consolidate `migrations/`, `supabase/migrations/`, and prod's actual `schema_migrations` history into a single source of truth | M | Team process decision |

### Security items
- P0 | RLS is disabled on **all 27 tables** in prod, with 19 ERROR-level advisor findings; app relies entirely on server-side auth checks in Next.js route handlers/actions. If a Supabase anon/authenticated key is ever exposed client-side beyond what's intended, there is no DB-level backstop. At minimum, drop the dead `012_implement_rls_policies` policies that are lingering (inert but confusing), and document that RLS-off is an explicit, reviewed decision, not an oversight. | M | Architecture decision |
| P1 | `rls_auto_enable()` is a `SECURITY DEFINER` function publicly callable via RPC by `anon`/`authenticated` — revoke `EXECUTE` unless intentional | S | — |
| P2 | Enable Supabase Auth leaked-password protection | S | — |
| P2 | Set explicit `search_path` on the 8 `generate_*_display_id` trigger functions | S | — |

### Performance items
- P2 | Full performance-advisor output was too large to process in this session (100K+ chars) — re-run `get_advisors(type=performance)` directly and triage; index coverage looked reasonable in the manual index scan performed here, so this is likely low-urgency | S | — |

### Production readiness
- P1 | `/api/health` doesn't check DB connectivity — add a lightweight `SELECT 1` so uptime monitoring actually reflects DB health, not just process liveness | S | —
- P1 | `trs-dev` Supabase project is currently **paused/INACTIVE** — confirm whether dev/staging testing is happening anywhere at all right now | S | — |
- P2 | Confirm Vercel project setup (dual prod/preview) — not verified in this session | S | — |

---

## Section 7 — Executive Summary

- **Commits:** `main` 56 total · `dev` 25 total (only 1 ahead of `main`, 32 behind — effectively stale/abandoned except for one unmerged leave-management feature)
- **Files:** 179 total (`app/` 36, `components/` 78, `lib/` 18, `migrations/` 17, `supabase/migrations/` 6, root/misc 42)
- **DB tables in `trs-prod`:** 27 (RLS disabled on all 27)
- **Feature completion:** 32 complete / 21 partial / 9 missing across 62 tracked items ≈ **52% complete**
- **Critical bugs blocking safe production use:**
  1. **BUG-006** (effective_periods never computed by the app — silently defaults to 0 for every new/edited chapter going forward, corrupting auto-sequencing)
  2. **Period-instance generation pipeline appears unwired** — `period_instance` has 0 rows despite a fully finalized-looking timetable UI; the actual chapter-period → teacher schedule → daily period flow has never run successfully in production
  3. **BUG-003** (holiday date off-by-one on some devices/timezones)
  4. **RLS disabled fleet-wide** — acceptable only if the server-side-auth-only model is a deliberate, documented, reviewed decision
- **Estimated effort to reach production-ready state:** roughly 3–4 weeks of focused work for one engineer — 1 week for the P0 bugs and period-instance pipeline, 1–2 weeks for the Leave Requests feature (schema + rebase + app work) if it's actually wanted, and the remainder for security/consolidation cleanup. If Leave Requests is descoped, this drops to ~1.5–2 weeks.
- **Top 5 immediate actions:**
  1. Fix BUG-006 (`effective_periods`) and BUG-003 (`date.ts`) — both are small, both are actively corrupting data/UX today
  2. Diagnose and fix the timetable-finalize → `period_instance` generation gap — this is the entire point of the Teacher View / Attendance / Coverage system and it currently produces no rows
  3. Decide the fate of the Leave Requests feature: either commit to building the missing DB schema and rebasing `dev`'s UI onto current `main`, or explicitly shelve it and remove the half-built code so it doesn't mislead future audits
  4. Reconcile the three divergent migration sources (`migrations/`, `supabase/migrations/`, prod's actual applied history) into one
  5. Document (or reverse) the RLS-disabled-everywhere decision, and revoke public execute on `rls_auto_enable()`

---

## Note on the two follow-up JSON tasks included in this request

This request also included two additional JSON blocks below the audit spec: (1) a DB migration to add `branch_id` to `teacher_attendance`, `period_instance`, `leave_request`, `substitution`, and `audit_log` on **both** `trs-dev` and `trs-prod`, and (2) a frontend task to build out branch-context plumbing (`getActiveBranch()`, `/api/set-branch`, a branch switcher, and query-level branch filtering).

I did not execute either of these, for reasons this audit surfaced directly:
- The audit task explicitly says *"read-only... do not run any migrations"*, which directly conflicts with the migration task appearing in the same message.
- **The migration as written would fail partway through**: `leave_request` and `substitution` do not exist in `trs-prod` at all (confirmed via `to_regclass`), so `ALTER TABLE leave_request ADD COLUMN ...` and `ALTER TABLE substitution ADD COLUMN ...` would both error.
- `trs-dev` (project `ujleafxujkdsfipzeucp`) is currently **paused (INACTIVE)** — it would need to be restored before any migration could run against it.
- The frontend task assumes branch-context filtering is desired, but the most recent related commit on `main` (`e701d64`) **deliberately removed** the branch selector and branch-based filtering — building it back out is a real product/architecture decision, not just a "check first, build if missing" checklist item.

If you'd like, I can draft a corrected migration (targeting only the tables that actually exist, and creating `leave_request`/`substitution` from scratch if you want the leave feature to move forward) and then implement the branch-context frontend work — happy to proceed on either once you confirm scope and give the go-ahead to write to production.
