-- Leave management: policy, balance, request, and substitution tracking.
-- These tables did not exist anywhere (dev or main) before this migration;
-- the dev branch's leave-management UI assumed them but never shipped a
-- schema for them.

CREATE TABLE IF NOT EXISTS public.leave_policy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_year_id uuid NOT NULL REFERENCES public.school_year(id),
  leave_type varchar NOT NULL CHECK (leave_type IN ('sick', 'casual', 'emergency', 'official')),
  name varchar NOT NULL,
  days_allowed integer NOT NULL DEFAULT 0,
  is_paid boolean NOT NULL DEFAULT true,
  requires_document boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (school_year_id, leave_type)
);

CREATE TABLE IF NOT EXISTS public.leave_balance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.teacher(id),
  school_year_id uuid NOT NULL REFERENCES public.school_year(id),
  leave_type varchar NOT NULL,
  used_days integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (teacher_id, school_year_id, leave_type)
);

CREATE TABLE IF NOT EXISTS public.leave_request (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id varchar UNIQUE,
  teacher_id uuid NOT NULL REFERENCES public.teacher(id),
  school_year_id uuid NOT NULL REFERENCES public.school_year(id),
  branch_id uuid REFERENCES public.branch(id),
  leave_type varchar NOT NULL,
  from_date date NOT NULL,
  to_date date NOT NULL,
  total_days integer NOT NULL,
  reason text NOT NULL,
  status varchar NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  reviewed_by uuid REFERENCES public.teacher(id),
  reviewed_at timestamptz,
  review_comment text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (to_date >= from_date)
);

CREATE TABLE IF NOT EXISTS public.substitution (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_instance_id uuid NOT NULL REFERENCES public.period_instance(id),
  leave_request_id uuid REFERENCES public.leave_request(id),
  original_teacher_id uuid NOT NULL REFERENCES public.teacher(id),
  substitute_teacher_id uuid REFERENCES public.teacher(id),
  date date NOT NULL,
  status varchar NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (period_instance_id)
);

CREATE INDEX IF NOT EXISTS idx_leave_policy_school_year ON public.leave_policy(school_year_id);
CREATE INDEX IF NOT EXISTS idx_leave_balance_teacher_year ON public.leave_balance(teacher_id, school_year_id);
CREATE INDEX IF NOT EXISTS idx_leave_request_teacher ON public.leave_request(teacher_id);
CREATE INDEX IF NOT EXISTS idx_leave_request_school_year ON public.leave_request(school_year_id);
CREATE INDEX IF NOT EXISTS idx_leave_request_status ON public.leave_request(status);
CREATE INDEX IF NOT EXISTS idx_leave_request_display_id ON public.leave_request(display_id);
CREATE INDEX IF NOT EXISTS idx_substitution_leave_request ON public.substitution(leave_request_id);
CREATE INDEX IF NOT EXISTS idx_substitution_substitute_teacher ON public.substitution(substitute_teacher_id);

-- display_id follows the same sequential prefix pattern as branch/school_year
-- (LR-0001, LR-0002, ...), generated at insert time via trigger.
CREATE SEQUENCE IF NOT EXISTS leave_request_display_id_seq;

CREATE OR REPLACE FUNCTION public.generate_leave_request_display_id()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.display_id IS NULL THEN
    NEW.display_id := 'LR-' || LPAD(nextval('leave_request_display_id_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_generate_leave_request_display_id ON public.leave_request;
CREATE TRIGGER trg_generate_leave_request_display_id
  BEFORE INSERT ON public.leave_request
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_leave_request_display_id();

-- RLS is disabled fleet-wide today (see 014_disable_all_rls.sql); these new
-- tables follow the same server-side-auth-only model for consistency.
ALTER TABLE public.leave_policy DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balance DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_request DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.substitution DISABLE ROW LEVEL SECURITY;
