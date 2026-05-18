# TRS School OS — Complete Frontend Design Audit

**Generated:** May 18, 2026  
**Application:** The Rosary School — Internal Operations Platform  
**Framework:** Next.js with TypeScript, Tailwind CSS, shadcn/ui components  
**Status:** Active  

---

## 1. Design Tokens (Current State)

### 1.1 Color Palette

| Token Name | Hex Value | Usage | CSS Variable |
|---|---|---|---|
| **Primary Brand** | #ba2032 | Buttons, active states, brand accents | --color-brand |
| **Primary Hover** | #a01b2b | Hover states on primary elements | --color-brand-hover |
| **Primary Light** | #fce8ea | Background tints, light accents | --color-brand-light |
| **Background** | #ffffff | Page background | --color-background |
| **Foreground** | #0f0f10 | Primary text | --color-foreground |
| **Card Background** | #ffffff | Card backgrounds | --color-card |
| **Card Foreground** | #0f0f10 | Card text | --color-card-foreground |
| **Secondary** | #f4f4f5 | Secondary backgrounds, hover states | --color-secondary |
| **Secondary Foreground** | #0f0f10 | Text on secondary | --color-secondary-foreground |
| **Muted** | #f4f4f5 | Muted backgrounds | --color-muted |
| **Muted Foreground** | #a1a1aa | Secondary text, placeholders | --color-muted-foreground |
| **Accent** | #fce8ea | Accent backgrounds (light pink) | --color-accent |
| **Accent Foreground** | #ba2032 | Text on accent backgrounds | --color-accent-foreground |
| **Border** | #e4e4e7 | Borders, dividers | --color-border |
| **Input Border** | #e4e4e7 | Form input borders | --color-input |
| **Destructive** | #dc2626 | Error states, delete actions | --color-destructive |
| **Destructive Foreground** | #ffffff | Text on destructive | --color-destructive-foreground |
| **Success** | #16a34a | Success states, completion | --color-success |
| **Success Light** | #dcfce7 | Success background tint | --color-success-light |
| **Warning** | #d97706 | Warning states, attention needed | --color-warning |
| **Warning Light** | #fef3c7 | Warning background tint | --color-warning-light |
| **Danger** | #dc2626 | Danger states | --color-danger |
| **Danger Light** | #fee2e2 | Danger background tint | --color-danger-light |
| **Info** | #2563eb | Information, help text | --color-info |
| **Info Light** | #dbeafe | Info background tint | --color-info-light |

### 1.2 Sidebar Colors (Dark Theme)

| Token Name | Hex Value | Usage |
|---|---|---|
| Sidebar Background | #1c0509 | Main sidebar background |
| Sidebar Foreground | #f0dede | Sidebar text color |
| Sidebar Primary | #ba2032 | Active menu item background |
| Sidebar Primary Foreground | #ffffff | Active menu item text |
| Sidebar Accent | rgba(186, 32, 50, 0.25) | Hover/inactive states |
| Sidebar Accent Foreground | #f0dede | Accent text |
| Sidebar Border | rgba(255, 255, 255, 0.07) | Dividers |
| Sidebar Ring | #ba2032 | Focus ring color |

### 1.3 Typography

| Element | Font Family | Font Size | Font Weight | Line Height | Usage |
|---|---|---|---|---|---|
| **Body** | Poppins (fallback sans-serif) | 14px | 400 | 1.6 | Body text, general content |
| **Headings** | Kumbh (fallback sans-serif) | Various | 600 | 1.25 | All h1-h6 headings |
| **H1** | Kumbh | 1.75rem (28px) | 600 | 1.25 | Main page titles |
| **H2** | Kumbh | 1.375rem (22px) | 600 | 1.25 | Section headings |
| **H3** | Kumbh | 1.125rem (18px) | 600 | 1.25 | Subsection headings |
| **H4** | Kumbh | 1rem (16px) | 600 | 1.25 | Card titles |
| **Label** | Poppins | 11px | 500 | 1 | Form labels, uppercase |
| **Small text** | Poppins | 12px | 400 | 1.6 | Secondary text, hints |
| **Smallest text** | Poppins | 10px | 400 | 1.6 | Badge labels, timestamps |

### 1.4 Spacing

| Token Name | Value | Usage |
|---|---|---|
| xs | 2px | Micro gaps |
| sm | 4px | Tight spacing |
| md | 8px | Default padding/gap |
| lg | 12px | Generous spacing |
| xl | 16px | Large gaps |
| 2xl | 24px | Extra large gaps |
| 3xl | 32px | Between sections |
| 4xl | 48px | Major section breaks |

Default spacing used:
- **Card padding:** px-4 py-4 (16px/16px)
- **Card content:** px-4 (16px horizontal)
- **Input height:** 34px (8px padding, border, ~18px font)
- **Button height (default):** 10px (h-10)
- **Gap between elements:** gap-4 (16px)

### 1.5 Border Radius

| Token Name | Value | Usage |
|---|---|---|
| sm | 6px | Small elements, subtle rounding |
| md | 8px | Default radius (buttons, inputs, cards) |
| lg | 12px | Larger components |
| xl | 16px | Cards, major components |
| full | 9999px | Pills, badges, fully rounded |

Current usage:
- **Input fields:** rounded-lg (8px)
- **Buttons:** rounded-lg (8px)
- **Cards:** rounded-xl (16px) — defined in CSS as `border-radius: 12px` for cards
- **Pill buttons/tags:** rounded-full (9999px)

### 1.6 Shadows

| Token Name | CSS | Usage |
|---|---|---|
| None | — | Card backgrounds (explicitly no shadow) |
| sm | 0 1px 3px rgba(0,0,0,0.08) | Tab active state |
| md | Variable (not explicitly defined) | Generally not used |

Current implementation: Cards use `ring-1 ring-foreground/10` instead of box-shadow.

### 1.7 Border Styles

| Type | Style | Usage |
|---|---|---|
| Default | 0.5px solid var(--color-border) | All borders |
| Input focus | 0 0 0 3px rgba(186, 32, 50, 0.08) | Focus ring on inputs/selects |
| Dashed | border-dashed | Empty slots in timetable |
| Status left border | 4px solid [color] | Period cards (green/amber/red/gray) |

---

## 2. Screen Inventory

### 2.1 Authentication Routes

#### `/sign-in`
- **Layout:** Two-column layout (left: branding, right: form)
- **Auth:** Public (no login required)
- **States:** Default, loading, error
- **Fields:**
  - Email (required, type="email")
  - Password (required, type="password")
  - Error message (conditional)
- **Actions:**
  - Sign in button → validates, calls Supabase auth
  - Link to password reset
  - Display "Invite only access" message
- **Left Panel:**
  - Background: #1c0509
  - Logo: 160x48px
  - Brand messaging with 3 bullet points
  - Copyright notice
- **Right Panel:**
  - Background: #f5f2eb
  - Form container (max-width: sm)

#### `/sign-up/[[...sign-up]]`
- **Layout:** Redirect-only
- **Auth:** Public
- **Behavior:** Redirects to `/sign-in` (sign-up disabled)

#### `/reset-password`
- **Layout:** Two-column layout (same as sign-in)
- **Auth:** Public
- **States:** Checking, request, update
- **Mode 1 (Request):**
  - Email field
  - Submit button "Send reset link"
- **Mode 2 (Update — when recovery session active):**
  - New password field
  - Confirm password field
  - Submit button "Update password"
- **Behavior:** Checks session on mount, shows appropriate form

---

### 2.2 Dashboard Layout

All dashboard routes share a common layout:
- **Sidebar:** Dark (#1c0509), sticky, 240px width
  - Logo (140x36px)
  - Nav groups: "Admin", "Content"
  - User info footer (name, role, sign-out button)
- **Header:** Light, 48px height
  - Sidebar toggle
  - Vertical divider
  - Page header (title based on route)
- **Main content:** Flex column, p-6, overflow-auto

#### `/admin` (Admin Dashboard)
- **Route:** `/admin`
- **Access:** admin, coordinator (redirects teachers to `/teacher`)
- **Purpose:** Operational overview, period coverage, flagged items
- **Sections:**
  1. Header with refresh button
  2. Alert cards (if no active school year or no schedule)
  3. Stats row (4 columns):
     - Today's coverage % (with logged/total)
     - Unlogged periods count
     - Weekly coverage %
     - Active teachers count
  4. Two-column grid:
     - Flagged periods (left) — shows 10 unlogged periods, max-height with scroll
     - This week summary (right) — day-by-day breakdown, absence list
  5. Teacher performance table — sortable, shows coverage bars
  6. Chapter progress — expandable by standard, shows status badges
- **Data Loaded:** activeSchoolYear, teachers, standards, divisions, subjects, periodInstances, unloggedPeriods, coverageSummary, chapters, absences, holidays
- **Features:**
  - Refresh dashboard button (calls flagUnloggedPeriods and refreshDashboard actions)
  - Toast notifications (sonner)
  - Week start/end navigation in header

#### `/admin/users`
- **Route:** `/admin/users`
- **Access:** admin only (redirects non-admin to `/admin`)
- **Purpose:** User management, invite-only system
- **Sections:**
  1. Header with description
  2. UserManagement component (handles invite/activation/role assignment)
- **Data:** teacher list (id, name, email, role, is_active, created_at)

#### `/setup`
- **Route:** `/setup`
- **Access:** admin only (coordinators → `/content`, teachers → `/teacher`)
- **Purpose:** Academic structure configuration
- **Structure:** Tab-based navigation with 7 tabs:
  1. **School Year** — create/edit/set active
  2. **Segments** — academic segments per standard
  3. **Standards & Divisions** — grade levels and class divisions
  4. **Subjects** — subject definitions
  5. **Teachers** — teacher roster
  6. **Chapters** — chapter definitions
  7. **Assignments** — teacher-subject-division assignments
- **On-Page Guidance:** Right panel explains "How it works" with step-by-step instructions
- **Features:** Inline editing with EditableRow component, toast notifications

#### `/timetable`
- **Route:** `/timetable`
- **Access:** admin only
- **Purpose:** Weekly slot configuration and schedule generation
- **Layout:** Sticky header + tabs
- **Header Section:**
  - Title "Timetable"
  - Active school year badge
  - Standard selection pills (All + individual standards)
  - Division selection pills (filtered by standard)
- **Tabs:**
  1. **Timetable** — SlotGrid component
     - Grid: 5 day columns (MON-FRI), 8 period rows
     - Color-coded by subject (hash-based colors)
     - Click to edit, shows dialog for subject/teacher assignment
     - "RECESS" row divider between periods 4-5
  2. **Holidays** — HolidayManager component
     - Define holidays per school year
  3. **Generate Schedule** — ScheduleGenerator component
     - Generates period_instance records from slots and chapters
- **Data:** schoolYears, standards, divisions, subjects, teachers, teacherAssignments, timetableSlots, holidays, segments, chapters

#### `/content`
- **Route:** `/content`
- **Access:** admin, coordinator
- **Purpose:** Content (lesson plan, MCQ, test) upload and status tracking
- **Layout:** Two-panel
- **Left Panel (420px, sticky):**
  - Header: Title "Content", active school year badge
  - Standard selection pills (All + individual)
  - Subject dropdown (filtered by standard)
  - Status filter buttons: All, Pending, In Progress, Complete
  - Summary stats: total chapters, complete, pending
  - Scrollable chapter list (grouped by subject and segment)
  - Each chapter row: ChapterStatusRow with status badge, click to select
- **Right Panel:**
  - Empty state (BookOpen icon, "Select a chapter") until chapter selected
  - UploadPanel component when chapter selected
    - Header with chapter metadata (badges for subject, segment, allocated/effective periods)
    - Tabs: Lesson Plans, MCQs, Test
    - Lesson Plans tab:
      - Grid of period rows (one per allocated period)
      - Each row: period #, title input, upload button, publish toggle, view button
      - Color coding: green if published, amber if uploaded/draft, gray if empty
    - MCQs tab: JSON editor with format reference
    - Test tab: JSON editor for test structure
- **Data:** schoolYears, segments, standards, subjects, chapters, chapterPeriods, mcqs, tests
- **Features:** File upload (PDF/DOCX), publish toggle, inline title editing

#### `/teacher`
- **Route:** `/teacher`
- **Access:** all roles (teachers see own, admin/coordinator can select)
- **Purpose:** Weekly schedule view and period logging
- **Layout:** Main + right sidebar (admin only)
- **Top Bar:**
  - Left: Week navigation (prev/next buttons, date range label)
  - Center: "Today" button
  - Right: Teacher selector dropdown (admin/coordinator only)
- **Main Content:**
  - WeekView component (5-column grid, MON-FRI)
  - Each day column:
    - Date header (highlighted in brand color if today)
    - Holiday indicator
    - PeriodCard stack (one per period instance)
- **Right Sidebar (admin only, 320px):**
  - AbsencePanel component
  - Mark absences, select substitute teacher
- **PeriodCard Details:**
  - Period # and time (e.g., "Period 1 • 8:00 - 8:45")
  - Status badge (Done, Partial, Not done, Unlogged, Cancelled, Buffer)
  - Subject name
  - Standard • Division
  - Chapter name and period sequence
  - Coverage note (if applicable)
  - Substitution indicator (if applicable)
  - Buttons: View Plan, Log Period, Edit log (conditional on status and user role)
  - Border-left color codes: green (done), amber (partial), red (not done), gray (unlogged/buffer)
- **Data:** periodInstances, timetableSlots, chapters, chapterPeriods, subjects, standards, divisions, teachers, absences
- **Features:** Week navigation, teacher selection, period logging modal, substitution tracking

---

## 3. Component Inventory

### 3.1 Layout Components

#### `AppSidebar` (components/layout/app-sidebar.tsx)
- **Purpose:** Main navigation sidebar
- **Props:** role, teacherName
- **Width:** 240px (managed by SidebarProvider)
- **Features:**
  - Logo at top (140x36px)
  - Dividers (custom styled)
  - Nav groups with labels (uppercase, 10px, gray)
  - Menu items with active state highlighting
  - Footer with user info and sign-out button
- **Styling:** All inline CSS (CSS variables for dark theme)
- **States:** Active nav item highlighted in brand color (#ba2032)

#### `PageHeader` (components/layout/page-header.tsx)
- **Purpose:** Dynamic page title in header
- **Props:** None (reads pathname)
- **Returns:** Text label based on route (e.g., "Admin Dashboard")
- **Font:** Kumbh, 14px, medium

### 3.2 Admin Components

#### `DashboardShell` (components/admin/dashboard-shell.tsx)
- **Purpose:** Full admin dashboard container
- **Props:** All data arrays, role, dates
- **Composition:**
  - Header (h1, subtitle, refresh button)
  - Empty state cards (no school year, no schedule)
  - Stats grid (4 columns, StatCard components)
  - Two-column section (FlaggedPeriods, This Week summary)
  - TeacherTable (6 columns)
  - ChapterProgress (expandable)
- **Logic:** Calculates coverage %, color-codes by threshold (≥80% green, ≥50% amber, <50% red)

#### `StatCard` (components/admin/stat-card.tsx)
- **Purpose:** Metric card with icon
- **Props:** title, value, subtitle, icon ("CheckCircle"|"AlertTriangle"|"TrendingUp"|"Users"), iconColor ("green"|"red"|"amber"|"blue")
- **Dimensions:** Fixed height, takes 1/4 of parent width
- **Icon:** Background circle (top-right), colored based on iconColor
- **Value:** Large (text-3xl, font-bold)

#### `TeacherTable` (components/admin/teacher-table.tsx)
- **Purpose:** Performance table for weekly coverage
- **Props:** teachers, coverageSummaryThisWeek, subjectMap, periodInstancesThisWeek, weekStart, chapterMap
- **Columns:** Teacher, Subjects, Scheduled, Done, Partial, Unlogged, Coverage (bar + %), Action
- **Features:**
  - Sortable by coverage % (worst first)
  - Coverage bar visualization (colored by %)
  - "View" button links to teacher page
- **Overflow:** Horizontally scrollable
- **Row hover:** Subtle background change

#### `FlaggedPeriods` (components/admin/flagged-periods.tsx)
- **Purpose:** List of unlogged periods
- **Props:** unloggedPeriods, teacherMap, subjectMap, divisionMap, standardMap, chapterMap
- **Layout:** Card (p-6)
- **Content:**
  - Shows first 10 unlogged periods
  - Each item: teacher name, subject, date, days overdue badge, View button
  - Empty state with CheckCircle icon
- **Days Overdue Color:** Red (>2d), amber (≥1d), gray (today)
- **Scroll:** max-height 384px (overflow-y-auto)

#### `ChapterProgress` (components/admin/chapter-progress.tsx)
- **Purpose:** Chapter completion status by standard
- **Props:** chapters, academicSegments, standards, subjects, periodInstancesThisWeek
- **Structure:** Expandable by standard
  - Header: Standard name, chevron (rotates on expand)
  - Expanded: Subject groups, chapter rows
  - Chapter row: name, allocated/effective periods, status badge, progress text
- **Status:** "Completed" (all done), "In Progress", "Not Started"
- **Color:** Green, amber, gray respectively
- **Background:** Expanded sections have bg-muted/30

#### `UserManagement` (components/admin/user-management.tsx)
- **Purpose:** User invite and management
- **Features:** (Not fully inspected, referenced in users page)

### 3.3 Teacher Components

#### `TeacherShell` (components/teacher/teacher-shell.tsx)
- **Purpose:** Container for teacher schedule view
- **Props:** role, currentTeacherId, currentUserProfile, weekStart, data
- **Layout:** Main (flex-1) + right sidebar (320px, admin only)
- **Top Bar:**
  - Week nav (chevron buttons, date label, "Today" button)
  - Teacher selector (if not teacher role)
- **Features:**
  - handleWeekChange (updates URL params)
  - handleTeacherChange (updates URL params)
  - Passes data to WeekView and AbsencePanel

#### `WeekView` (components/teacher/week-view.tsx)
- **Purpose:** 5-day schedule grid
- **Props:** periodInstances, timetableSlots, chapters, chapterPeriods, subjects, standards, divisions, weekStart, isTeacher, canLog, loggedBy
- **Layout:** CSS grid, 5 columns (MON-FRI)
- **Each column:**
  - Date header (bg-brand if today, bg-muted otherwise)
  - Day label (uppercase), date number, holiday indicator
  - PeriodCard stack or "No periods" message
- **Logic:** Groups period instances by date, sorts by period_number
- **Empty state:** "No schedule generated yet for this week"

#### `PeriodCard` (components/teacher/period-card.tsx)
- **Purpose:** Individual period display
- **Props:** periodInstance, slot, chapter, chapterPeriod, subject, standard, division, isTeacher, canLog, loggedBy
- **Layout:** Border-left indicator, content area, action buttons
- **Header:** Period # and time, status badge
- **Content:** Subject, standard • division, chapter info
- **Conditional displays:**
  - Substitution warning (amber bg)
  - Coverage note (muted bg)
  - Logged date (if status is done/partial/not_done)
- **Status colors:** 
  - Done → green border-l, CheckCircle badge
  - Partial → amber border-l, AlertCircle badge
  - Not done → red border-l, XCircle badge
  - Unlogged → orange border-l, AlertCircle badge
  - Cancelled → gray dashed, opacity-60
  - Buffer → gray dashed
- **Buttons:** "View Plan" (if published), "Log Period" (if can log), "Edit log" (if already logged)

#### `AbsencePanel` (components/teacher/absence-panel.tsx)
- **Purpose:** Absence and substitution management
- **Features:** (Not fully inspected)

#### `LogModal` (components/teacher/log-modal.tsx)
- **Purpose:** Modal for logging period status
- **Features:** (Not fully inspected)

### 3.4 Timetable Components

#### `TimetableShell` (components/timetable/timetable-shell.tsx)
- **Purpose:** Main timetable container
- **Layout:** Sticky header + tabs
- **Header:** Standard and division pill filters
- **Tabs:** Timetable (SlotGrid), Holidays (HolidayManager), Generate Schedule (ScheduleGenerator)
- **State:** selectedStandardId, selectedDivisionId, activeTab

#### `SlotGrid` (components/timetable/slot-grid.tsx)
- **Purpose:** Weekly timetable grid editor
- **Layout:** Grid 6 columns (period label + 5 days), multiple rows (1 per period + recess divider)
- **Cells:** Clickable buttons (min-h-92px)
  - Filled slots: Show subject name, teacher name, time
  - Empty slots: Dashed border, + icon on hover
- **Colors:** Hash-based color per subject (6-color palette)
- **Editor Dialog:** Subject and teacher selectors, Clear slot button
- **Features:** 
  - Subject selection filters teachers by assignment
  - Teacher options: assigned teachers (if any) or all active teachers

#### `ScheduleGenerator` (components/timetable/schedule-generator.tsx)
- **Purpose:** Generate schedule from slots and chapters
- **Features:** (Not fully inspected)

#### `HolidayManager` (components/timetable/holiday-manager.tsx)
- **Purpose:** Holiday date management
- **Features:** (Not fully inspected)

### 3.5 Content Components

#### `ContentShell` (components/content/content-shell.tsx)
- **Purpose:** Main content management container
- **Layout:** Two-panel (left sidebar 420px, right main area)
- **Left Panel:**
  - Standard, subject, status filter pills/dropdowns
  - Summary stats (total, complete, pending)
  - Chapter list (grouped by subject + segment)
- **Right Panel:**
  - UploadPanel (when chapter selected) or empty state
- **Features:**
  - ChapterStatusRow items clickable
  - Group headers with subject name and segment name

#### `ChapterStatusRow` (components/content/chapter-status-row.tsx)
- **Purpose:** Clickable chapter summary row
- **Props:** chapter, status, uploadedCount, publishedCount, selected, onSelect
- **Display:** Chapter name, status badge, progress indicators

#### `UploadPanel` (components/content/upload-panel.tsx)
- **Purpose:** Lesson plan, MCQ, test management for a chapter
- **Layout:** Header (chapter info + badges) + tabs
- **Header:** Chapter #.name, subject/segment badges, allocated/effective periods
- **Tabs:**
  1. **Lesson Plans:**
     - Grid of period rows (1 per allocated period)
     - Each row: period #, title input, upload button, publish toggle, open button
     - Color coding (emerald if published, amber if draft, gray if empty)
  2. **MCQs:**
     - JSON editor with format reference
     - Save button
  3. **Test:**
     - JSON editor
     - Save button
- **Features:** File upload (PDF/DOCX), publish/draft toggle, inline title editing

### 3.6 Setup Components

#### `SchoolYearTab` (components/setup/school-year-tab.tsx)
- **Layout:** Two-column cards
- **Left:** Create form + editable list
- **Right:** Instructions with "How it works" guide
- **Features:** Create, edit (inline), delete, set active

#### `StandardsTab` (components/setup/standards-tab.tsx)
- **Purpose:** (Not fully inspected, similar pattern to SchoolYearTab)

#### `SubjectsTab` (components/setup/subjects-tab.tsx)
- **Purpose:** (Not fully inspected)

#### `TeachersTab` (components/setup/teachers-tab.tsx)
- **Purpose:** (Not fully inspected)

#### `SegmentsTab` (components/setup/segments-tab.tsx)
- **Purpose:** (Not fully inspected)

#### `AssignmentsTab` (components/setup/assignments-tab.tsx)
- **Purpose:** (Not fully inspected)

#### `ChaptersTab` (components/setup/chapters-tab.tsx)
- **Purpose:** (Not fully inspected)

### 3.7 Shared Components

#### `EditableRow` (components/shared/editable-row.tsx)
- **Purpose:** Inline edit/delete row pattern
- **Props:** children (view content), editForm, onDelete, deleteConfirmText, className
- **States:**
  - View: Hover reveals edit/delete buttons (opacity 0 → 100)
  - Edit: Background turns pink (#fce8ea), shows form
  - Delete confirm: Shows "Delete?" with check/cancel buttons
- **Colors:**
  - View: bg-secondary/40, hover bg-secondary/60
  - Edit: bg-#fce8ea, border-#f0b0b7
  - Delete buttons: hover:text-destructive, hover:bg-destructive/10

#### `ListItem` (components/shared/list-item.tsx)
- **Purpose:** (Not fully inspected)

### 3.8 UI Components (shadcn/ui)

All sourced from shadcn/ui library with Tailwind styling:

| Component | Usage | States |
|---|---|---|
| **Button** | All action buttons | default, outline, secondary, ghost, destructive, link |
| **Card** | Content containers | default |
| **Badge** | Status labels, tags | default, secondary, destructive, outline, ghost |
| **Input** | Text/email/date/number fields | default, focus, disabled |
| **Label** | Form labels | uppercase, 11px |
| **Select** | Dropdown selectors | trigger, content, item |
| **Tabs** | Multi-section navigation | list, trigger, content |
| **Dialog** | Modal dialogs | open, close |
| **AlertDialog** | Confirmation dialogs | (Not heavily used) |
| **Textarea** | Multi-line text input | default, focus |
| **Badge** | Status and metadata labels | Various variants |
| **Sidebar** | Navigation sidebar | dark theme |
| **Separator** | Visual dividers | horizontal, vertical |
| **Skeleton** | Loading placeholders | (Not visible in code) |
| **Toast** (sonner) | Notifications | success, error, warning, info |

---

## 4. Navigation & Information Architecture

### 4.1 Sidebar Navigation by Role

#### Admin Role
```
Admin
├── Admin Dashboard (/admin)
├── Users (/admin/users)
├── Setup (/setup)
└── Timetable (/timetable)

Content
└── Content (/content)
```

#### Coordinator Role
```
Content
└── Content (/content)
```

#### Teacher Role
- No sidebar (only dashboard access)
- Direct link: `/teacher` (viewed from dashboard if admin/coordinator)

### 4.2 URL Structure

| Route | Role(s) | Redirect if Unauthorized |
|---|---|---|
| `/` (home) | All | Redirects to role landing (dashboard, admin, or sign-in) |
| `/sign-in` | Public | (redirects to home if already logged in) |
| `/sign-up` | Public | Redirects to `/sign-in` |
| `/reset-password` | Public | (stays) |
| `/admin` | admin, coordinator | Teachers → `/teacher` |
| `/admin/users` | admin | Non-admin → `/admin` |
| `/setup` | admin | Coordinators → `/content`, teachers → `/teacher` |
| `/timetable` | admin | Others → role landing page |
| `/content` | admin, coordinator | Teachers → `/teacher` |
| `/teacher` | all | Restricted if no auth |

### 4.3 Navigation Patterns

#### Breadcrumb: Implicit (no visible breadcrumbs)
- Page header shows current route label
- Back navigation via sidebar or browser back

#### Drill-down: Teacher week navigation
- Week nav buttons (prev/next) change URL params
- Teacher selector (admin/coordinator) changes URL param
- Links preserve query params when navigating

#### Modals: Used for:
- Timetable slot editor (dialog overlay)
- Period logging (LogModal)
- Password reset confirmation (implicit)

#### Drawer: Not currently used

### 4.4 Access Control

- Middleware validates user role before rendering dashboard layout
- Pages redirect if role doesn't match (see table above)
- Some features hidden based on role (e.g., teacher selector only for admin/coordinator)
- Admin canLog = true, teacher canLog = false (in TeacherShell)

---

## 5. Form Inventory

### 5.1 Authentication Forms

#### Sign In Form
- **Location:** `/sign-in`
- **Fields:**
  - Email (text input, required, autocomplete="email")
  - Password (password input, required, autocomplete="current-password")
- **Submit:** "Sign in" button (brand color, loading state with spinner)
- **Validation:** Client + Supabase auth API
- **Success:** Redirects to `/`
- **Error:** Error message displayed in red box (bg-red-50, border-red-200, text-red-700)
- **Links:** "Forgot password?" → `/reset-password`

#### Reset Password Form (Request)
- **Location:** `/reset-password` (mode: "request")
- **Fields:**
  - Email (text input, required)
- **Submit:** "Send reset link" button
- **Success:** Message: "We sent a password reset link to your email."
- **Error:** Displays error message

#### Reset Password Form (Update)
- **Location:** `/reset-password` (mode: "update", when recovery session active)
- **Fields:**
  - New password (password input, required, minLength=6, autocomplete="new-password")
  - Confirm password (password input, required, minLength=6, autocomplete="new-password")
- **Validation:** Passwords must match
- **Submit:** "Update password" button
- **Success:** Signs out, redirects to `/sign-in`
- **Error:** Displays error message

### 5.2 Setup Forms (All in `/setup`)

#### School Year Form
- **Create:**
  - Name (text input, e.g., "2026-27")
  - Start date (date input)
  - End date (date input)
  - Submit: "+ Add school year" button
- **Edit:**
  - Name, start date, end date (in EditableRow)
  - Submit: "Save changes" button
- **Actions:** Delete (with confirmation)
- **Features:** "Set as active" button (green check icon)

#### Standards Form
- **(Not fully inspected, follows similar EditableRow pattern)**

#### Subjects Form
- **(Not fully inspected)**

#### Teachers Form
- **(Not fully inspected)**

#### Segments Form
- **(Not fully inspected)**

#### Assignments Form
- **(Not fully inspected)**

#### Chapters Form
- **(Not fully inspected)**

### 5.3 Timetable Editor

#### Slot Assignment Dialog
- **Trigger:** Click empty or filled slot in SlotGrid
- **Fields:**
  - Subject (select, filtered by standard)
  - Teacher (select, filtered by assignment if available)
- **Validation:** Both required
- **Submit:** "Save slot" button (disabled if incomplete)
- **Actions:** "Clear slot" button (if editing existing)
- **Helper text:** "Showing assigned teachers" or "No assignment found, showing all active teachers"

### 5.4 Content Management

#### Lesson Plan Upload
- **Location:** Content → Chapter → Lesson Plans tab
- **Fields (per period):**
  - Title (text input, on blur saves)
  - File upload (button, accept=".pdf,.docx,.doc")
  - Publish toggle (if file exists)
- **Submit:** Auto-save on file upload
- **Actions:** "View Plan" (link to file), "Publish"/"Draft" toggle

#### MCQ Management
- **Location:** Content → Chapter → MCQs tab
- **Fields:**
  - MCQ set JSON (textarea, code block)
- **Format help:** Collapsible reference showing JSON structure
- **Submit:** "Save MCQs" button
- **Displays:** "[N] questions saved"

#### Test Management
- **Location:** Content → Chapter → Test tab
- **Fields:**
  - Test JSON (textarea, code block)
- **Submit:** "Save Test" button
- **Display:** "Test saved" or "Not created yet"

### 5.5 Admin Features

#### Period Logging (LogModal)
- **Trigger:** "Log Period" or "Edit log" button on PeriodCard
- **Fields:**
  - Status (select: done, partial, not_done, cancel)
  - Notes (textarea, optional)
  - Logged by (hidden, from currentUserProfile)
- **Submit:** "Log" button
- **Features:** Cancel button

#### Absence Marking (AbsencePanel)
- **(Not fully inspected)**
- **Location:** Right sidebar on `/teacher` (admin only)

#### Holiday Management (HolidayManager)
- **(Not fully inspected)**
- **Location:** `/timetable` → Holidays tab

---

## 6. Current UX Problems & Inconsistencies

### 6.1 Styling Inconsistencies

1. **Mixed color definitions:**
   - Some hardcoded hex values: `style={{ background: "#1c0509" }}` in sign-in page
   - Should use CSS variables consistently
   - EditableRow uses `bg-[#fce8ea]` and `border-[#f0b0b7]` as Tailwind arbitrary values instead of CSS vars

2. **Inconsistent spacing:**
   - Card padding: sometimes `p-6`, sometimes `px-4 py-4`, sometimes `px-5 py-4`
   - Input height varies: `h-7`, `h-8`, `h-10` used in different forms
   - No standardized padding system across forms

3. **Button sizing inconsistency:**
   - Some buttons use `h-7 text-xs`, others `h-8`, others `h-10`
   - Size/text-size combinations not standardized
   - Gap between buttons varies

4. **Badge variant confusion:**
   - Some use `variant="secondary"`, some use `variant="outline"` with custom colors
   - Status badges use inline `className` for colors instead of variants
   - No dedicated "success", "warning", "error" badge variants

5. **Border usage:**
   - Input borders: some `border-0.5px`, some default Tailwind
   - Cards: `ring-1 ring-foreground/10` instead of border
   - Inconsistent border-radius: cards use `rounded-xl` (16px), buttons `rounded-lg` (8px)

6. **Text styling:**
   - Some headings use `fontFamily: "var(--font-kumbh)"` inline
   - Some use class-based, some styled-component style
   - Label styling mixed: some `text-[10px]`, others `text-xs`

### 6.2 Missing States

1. **Loading states:**
   - Many components lack skeleton/placeholder states
   - TeacherTable doesn't show loading during week change
   - TimetableShell doesn't show loading during slot save

2. **Empty states:**
   - Most lists show "No items" message
   - Some don't (e.g., teacher selector dropdown)
   - No consistent empty state component

3. **Error states:**
   - Inputs don't show validation errors (inline)
   - Forms show errors only in toast
   - No clear visual feedback on invalid fields

4. **Disabled states:**
   - Buttons disabled during submission
   - Inputs not disabled during edit
   - No visual disabled state on form sections

### 6.3 Component Reuse Issues

1. **StatCard colors:**
   - Uses string enum ("green", "red", "amber", "blue")
   - Maps to Tailwind classes
   - Not consistent with design tokens

2. **Period status colors:**
   - PeriodCard has its own color mapping
   - ChapterProgress has separate color mapping
   - TeacherTable has yet another mapping
   - No shared constant

3. **Date formatting:**
   - Multiple places use `.toLocaleDateString()` with different options
   - No shared utility for date formatting

4. **EditableRow:**
   - Used for school years, standards, subjects, etc.
   - But styling hardcoded for brand color
   - Not reusable for other edit patterns

### 6.4 Accessibility Issues

1. **Missing ARIA labels:**
   - Icon-only buttons (close, delete, etc.) lack aria-labels
   - Status badges don't announce status to screen readers
   - Modal triggers don't have aria-expanded

2. **Color-only status:**
   - Period cards use border color to indicate status (no text labels in all cases)
   - Coverage bars show percentage only as color (not text)
   - Red/green usage without additional indicators

3. **Focus management:**
   - Modals likely don't trap focus
   - No visible focus indicators on custom buttons (header pills, status filter)
   - Input focus ring exists (blue outline) but uses brand color

4. **Link underlines:**
   - Some links use `hover:underline`, some don't
   - No consistent link styling

### 6.5 Responsiveness Issues

1. **Desktop-first only:**
   - TimetableShell minimum width: 920px (timetable grid not mobile-responsive)
   - ContentShell expects 420px sidebar + main area (not mobile-viable)
   - Sidebar toggle exists but pages not tested on mobile

2. **Horizontal overflow:**
   - TeacherTable wraps in overflow-x-auto (fine)
   - SlotGrid wraps in overflow-x-auto (fine)
   - Some forms exceed mobile viewport width

3. **No tablet layouts:**
   - Breakpoint usage minimal
   - Two-column layouts don't collapse to single column
   - Header doesn't adjust for smaller screens

### 6.6 Data Display Issues

1. **Table pagination:**
   - TeacherTable shows all teachers (could be 100+)
   - FlaggedPeriods shows only 10 (arbitrary limit)
   - No pagination controls

2. **List truncation:**
   - Chapter list in ContentShell could overflow
   - No max-height with virtualization

3. **Coverage bar visualization:**
   - TeacherTable uses colored bar + percentage
   - Admin dashboard uses different stat cards
   - Inconsistent visualization patterns

### 6.7 Interaction Patterns

1. **Inline editing:**
   - EditableRow shows edit button on hover
   - Title inputs in UploadPanel save on blur
   - No consistent pattern

2. **Confirmation workflows:**
   - Delete uses EditableRow's confirm state
   - Some actions (publish) toggle without confirmation
   - No consistent confirmation pattern

3. **Loading feedback:**
   - Long operations (upload) show spinner in button
   - No progress bars for multi-step operations
   - No estimated time remaining

4. **Navigation:**
   - Week selector uses URL params (good, but not bookmarkable across weeks)
   - Teacher selector uses URL params (good)
   - No breadcrumbs for clarity

---

## 7. Data Display Patterns

### 7.1 Tables

#### TeacherTable (Admin Dashboard)
- **Columns:** Teacher, Subjects, Scheduled, Done, Partial, Unlogged, Coverage, Action
- **Sortable:** By coverage % (worst-first default)
- **Paginated:** No (shows all)
- **Row interactivity:** Hover (subtle bg change), "View" button links to teacher page
- **Responsive:** Overflow-x-auto
- **Empty state:** Shows "No teachers" (not visible in code, implicit)

#### User table (Admin Users)
- **Columns:** (Not inspected)
- **Features:** (Not inspected)

#### Chapter list (Content page left panel)
- **Display:** Grouped by subject + segment
- **Row:** Chapter name, status badge, progress indicators
- **Sortable:** By grade → subject → segment
- **Selectable:** Click to view details
- **Empty:** "No chapters found matching filters"

### 7.2 Lists

#### Flagged Periods (Admin Dashboard)
- **Display:** Card list (max 10 visible)
- **Row content:** Teacher name, subject, date, days overdue badge, View button
- **Empty state:** "All periods logged. Nice work." (with CheckCircle icon)
- **Scroll:** max-h-96, overflow-y-auto

#### School years (Setup → School Year tab)
- **Display:** EditableRow stack
- **Row content:** Year name, "Active" badge or "Set as active" button, date range
- **Empty:** Creates form shown first
- **Edit/delete:** On hover

#### Unlogged periods (Admin Dashboard)
- **Type:** List of period instances
- **Display:** Showing date, teacher, subject, days overdue

### 7.3 Cards

#### StatCard (Admin Dashboard)
- **Content:** Title, large value, subtitle
- **Icon:** Circular badge (top-right)
- **Interaction:** Non-interactive
- **Size:** Fixed, 1/4 width in grid

#### Period Card (Teacher view)
- **Content:** Period #, status badge, subject, standard/division, chapter, notes
- **Interaction:** Buttons for log/view/edit
- **State visual:** Border-left color indicator
- **Responsive:** Stack on narrow screens (implicit)

#### Chapter info card (Content upload panel)
- **Content:** Chapter metadata (name, badges)
- **Display:** Sticky header above tabs

### 7.4 Badges

| Type | Colors | Usage |
|---|---|---|
| Status (period) | Green/amber/red/gray | Done, Partial, Not done, etc. |
| Status (chapter) | Green/amber/gray | Completed, In Progress, Not Started |
| Metadata | Outline variant | "Active", year count, allocated periods |
| Subject | Custom pink/blue | Subject tags in chapter info |
| Role | Secondary | "admin", "coordinator" on teacher rows |

### 7.5 Progress Indicators

#### Coverage bar (TeacherTable)
- **Type:** Horizontal bar + percentage text
- **Color:** Green (≥80%), amber (≥50%), red (<50%)
- **Display:** Precise percentage (e.g., "85.3%")

#### Chapter progress (ChapterProgress)
- **Type:** Status badge + progress text (e.g., "3 of 5 periods")
- **No visual bar, just text**

#### Period sequence (PeriodCard)
- **Display:** "Period N of M"
- **Text only, no progress bar**

### 7.6 Badges & Status Labels

#### Period status
- Badges with icons:
  - ✓ Done (green)
  - ⚠ Partial (amber)
  - ✗ Not done (red)
  - ⚠ Unlogged (orange)
  - Cancelled (gray)

#### Upload status (UploadPanel)
- **Color-coded period rows:**
  - Green (emerald) if published
  - Yellow (amber) if uploaded/draft
  - Gray if empty
- **Circular period # badge matching row color**

---

## 8. Responsive Behavior

### 8.1 Breakpoints in Use

- **Tailwind default:** sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px)
- **Explicit breakpoints in code:**
  - `min-w-[920px]` on SlotGrid (forces horizontal scroll below 920px)
  - `min-w-0` on various flex items (prevents overflow)
  - `w-full max-w-sm` on form containers (responsive up to sm)

### 8.2 Desktop Layouts (1280px+)

- **Sidebar:** 240px fixed
- **Main content:** Full width minus sidebar
- **Two-panel:** Can fit 420px sidebar + large main area
- **Timetable grid:** 5 columns + period label, no wrap

### 8.3 Tablet/Medium Layouts (768px - 1024px)

- **Sidebar:** Collapses to icon-only (SidebarProvider handles)
- **Timetable grid:** Still 920px minimum, requires scroll
- **Two-panel:** Sidebar may overflow or collapse
- **Overall:** Many pages still require horizontal scroll

### 8.4 Mobile Layouts (< 640px)

- **Not designed for mobile:**
  - Timetable requires 920px
  - ContentShell requires 420px sidebar + main area
  - Most forms exceed viewport width
  - No mobile-specific layouts
- **Sidebar:** Toggleable (hamburger icon)
- **Status:** **Desktop-only application** — mobile support not implemented

### 8.5 Component Responsiveness

| Component | Responsive? | Notes |
|---|---|---|
| AppSidebar | Partial | Can toggle, but width fixed |
| DashboardShell | Partial | Stats grid stays 4 columns |
| TeacherTable | Partial | Overflow-x-auto, no column hiding |
| SlotGrid | No | min-w-[920px] enforces scroll |
| ContentShell | Partial | Left panel sticky, right panel flexible |
| TimetableShell | No | Requires 920px minimum |
| WeekView | Partial | 5-column grid, overflow on small screens |

---

## 9. Interaction Patterns

### 9.1 Toast Notifications (Sonner)

| Event | Toast Type | Message | Auto-close |
|---|---|---|---|
| Period logged | success | "Period N logged" | Yes (5s) |
| Upload successful | success | "Period N uploaded" | Yes |
| Form saved | success | "Updated" / "Saved" | Yes |
| Publish toggled | success | "Published" / "Unpublished" | Yes |
| Delete confirm | — | Inline in EditableRow | Manual |
| Error (any) | error | Error message from server | Yes |
| Data refreshed | success | "Dashboard updated" | Yes |

**Position:** bottom-right (hardcoded in dashboard layout)  
**Appearance:** Colored background, icon (left), message text  

### 9.2 Confirmation Dialogs

#### EditableRow delete confirmation
- **Trigger:** Click delete button (trash icon)
- **Visual:** Inline state change in row
- **Options:** 
  - "Delete?" text appears
  - Check button (green) to confirm
  - X button (gray) to cancel
- **Behavior:** Calls onDelete() if confirmed

#### Period logging (LogModal)
- **Trigger:** "Log Period" button on PeriodCard
- **Behavior:** Modal opens
- **Options:** Save or cancel
- **No explicit confirmation for destructive actions**

#### Schedule generation (ScheduleGenerator)
- **Trigger:** "Generate" button
- **Behavior:** (Not fully inspected, likely has confirmation)

### 9.3 Inline Edit Patterns

#### EditableRow component
- **View state:** Shows content + hidden edit/delete buttons
- **Hover:** Buttons appear (opacity 0 → 100)
- **Edit click:** Switches to edit mode
  - Background changes to pink (#fce8ea)
  - Shows edit form
  - X button to cancel
- **Form submission:** Auto-saves, switches back to view mode
- **Delete:** Shows inline confirmation state

#### Title input in UploadPanel
- **Edit:** Text input field
- **On blur:** Auto-saves via handleTitleBlur
- **Feedback:** Toast success message
- **No visible edit mode toggle** (always editable)

#### Teacher selector in SlotGrid
- **Edit:** Opens dialog
- **Subjects:** Dropdown selector
- **Teachers:** Dropdown selector (filtered by assignment)
- **Clear:** "Clear slot" button
- **Save:** "Save slot" button

### 9.4 Drag Interactions

- **None currently implemented**
- **Could be added for:** Reordering chapters, dragging periods between days

### 9.5 Optimistic Updates

- **Not implemented:**
  - Form submissions wait for server response
  - Period logging modal doesn't close until saved
  - No offline support
- **Recommendation:** Add optimistic UI for common actions (log period, publish)

---

## 10. Designer Handoff Summary

### Overview
The Rosary School OS is an **admin-focused internal operations platform** built for three user roles: administrators (full system access), coordinators (content management), and teachers (schedule viewing and period logging). The application manages academic operations across multiple dimensions: lesson planning, timetable/schedule management, period tracking, and performance analytics.

### Core Workflows

**1. Academic Setup (Admin-only)**
- Administrators configure the school year, define standards (grades), divisions (class sections), subjects, and teachers
- Teachers are assigned to subjects per division per school year
- The setup is sequential and guided (tooltips indicate completion order)
- All editable via inline forms using EditableRow pattern

**2. Timetable Management (Admin-only)**
- Admins create weekly timetable slots: for each division, define which subject is taught in which period by which teacher
- Slots are visualized in a 5-day × 8-period grid with color-coded subjects
- Click any cell to edit subject/teacher (modal dialog)
- Once finalized, admins generate a schedule: expands slots into period_instance records linked to chapters
- Admins mark holidays to exclude days from scheduling

**3. Content Management (Admin & Coordinator)**
- Coordinators upload lesson plans per chapter-period (PDF/DOCX format)
- Each lesson plan can be drafted (unpublished) or published
- MCQs and chapter tests stored as JSON (pasted directly into textareas)
- Left panel shows filterable, grouped chapter list; right panel shows upload/edit forms for selected chapter
- Status tracked: not_started → in_progress → complete

**4. Period Logging (Admin only, viewing all teachers; Teachers viewing themselves)**
- Admin can view any teacher's weekly schedule
- Each period (class session) is a card showing subject, division, chapter, and current status
- Admin can click "Log Period" to mark it as done, partial, not_done, or cancelled
- Teachers can see their own schedule but not log (read-only)
- Status colors: green (done), amber (partial), red (not_done), orange (unlogged), gray (cancelled/buffer)

**5. Dashboard Analytics (Admin & Coordinator)**
- Real-time coverage overview: today's logged periods, unlogged flagged items, weekly average
- Teacher performance table: sortable by coverage %, shows per-teacher stats
- Chapter progress by standard: expandable tree, shows completion status
- Flagged (unlogged) periods listed with days overdue

### Design System

**Colors:**
- Primary brand: #ba2032 (deep red, used for active states, primary buttons, links)
- Sidebar: Dark (#1c0509) with cream/off-white text (#f0dede)
- Functional: Green (success, ≥80%), amber (warning, 50-80%), red (error, <50%)
- Neutral: White backgrounds, light gray borders, muted foreground for secondary text

**Typography:**
- Heading font: Kumbh (fallback sans-serif) — used for h1-h6 and page titles
- Body font: Poppins (fallback sans-serif) — 14px default
- Labels: 11px, uppercase, 500 weight
- Hierarchy: h1 (28px), h2 (22px), h3 (18px), h4 (16px) with consistent 1.25 line-height

**Spacing & Layout:**
- 8px grid system (consistent gap-4, px-4 padding)
- Cards: 16px padding, 12px border-radius
- Buttons: 8px radius, height varies (7px, 8px, 10px dependent on context)
- Two-column layouts common: sidebar (420px) + main, or sidebar (320px) + main
- Sticky headers (timetable, content) for persistent navigation

**Components:**
- Extensive use of shadcn/ui: Button, Card, Badge, Input, Select, Dialog, Tabs
- Custom EditableRow pattern for inline crud (edit + delete with confirmation)
- PeriodCard as the core display unit (color-coded status, action buttons)
- SlotGrid for 2D editing (timetable)
- StatCard for key metrics (4-up grid)
- TeacherTable for performance tracking

### Screens at a Glance

| Route | Role | Purpose | Key Elements |
|---|---|---|---|
| `/sign-in` | Public | Authentication | Two-column layout, email/password form, forgot password link |
| `/admin` | Admin, Coordinator | Dashboard | Stats grid, flagged periods, weekly overview, teacher table, chapter progress |
| `/setup` | Admin | Academic config | Tabbed interface, inline editing, sequential setup guide |
| `/timetable` | Admin | Schedule creation | Slot grid (5×8), holiday manager, schedule generator |
| `/content` | Admin, Coordinator | Lesson plans | Left panel (chapter list), right panel (upload/MCQ/test forms) |
| `/teacher` | All | Schedule view | 5-day week grid, period cards, logging (admin only) |
| `/admin/users` | Admin | User management | Invite/activate users, assign roles |

### Current State

**Mature for desktop use:** The UI is polished, consistent, and production-ready for desktop browsers (1280px+). Navigation is clear, data entry is guided, and analytics are prominent.

**Mobile: Not supported.** No tablet or mobile layouts exist; the app requires 900px+ horizontal space and will not adapt gracefully below that.

**Accessibility: Partial.** Focus styles exist, but ARIA labels are minimal, color-only status indicators present, and modal focus trapping is likely missing.

**Responsiveness: Limited.** Sidebar toggles but main content doesn't reflowing; two-column layouts don't stack on smaller screens; timetable grid enforces min-width.

### Next Steps for Designer Redesign

When redesigning in Stitch:
1. **Establish a component library:** Map all Button variants, Card states, Badge types, and table patterns
2. **Tokenize colors:** Create a palette token set (brand red, success green, warning amber, etc.) with light/dark modes
3. **Typography system:** Scale and hierarchy (h1-h6 + body variants)
4. **Spacing tokens:** 8px grid (xs, sm, md, lg, xl, 2xl)
5. **Interactive states:** Hover, focus, disabled, loading for all interactive elements
6. **Responsive breakpoints:** Define tablet (640px-1024px) and mobile (<640px) layouts for key screens
7. **Patterns:** EditableRow, PeriodCard, StatCard, TeacherTable — establish reusable patterns
8. **Accessibility:** Add ARIA labels, focus indicators, and keyboard shortcuts

### Strengths
- Clear role-based access control with intuitive navigation
- Consistent use of color for status (green/amber/red pattern)
- Structured data entry (tabs, modals, inline forms)
- Dense information display without clutter (grid layouts)
- Sidebar theme (dark, cohesive) stands out from main content

### Weaknesses
- Desktop-only (no mobile/tablet support)
- Some styling hardcoded instead of tokenized
- Inconsistent spacing and sizing (h-7, h-8, h-10 variations)
- Limited loading/empty/error states
- No breadcrumbs or secondary navigation
- Confirmation workflows inconsistent
- Accessibility missing (ARIA, keyboard nav)

---

**End of Audit — Ready for Stitch Redesign**
