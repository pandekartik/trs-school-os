import { createAdminClient } from "@/lib/supabase-admin";
import type { UserRole } from "@/lib/role-access";

export interface AuditLogEntry {
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entityType?: string;
  entityId?: string;
  entityLabel?: string;
  oldData?: Record<string, any> | null;
  newData?: Record<string, any> | null;
}

export async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("audit_log").insert({
      user_id: entry.userId,
      user_name: entry.userName,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId,
      entity_label: entry.entityLabel,
      old_data: entry.oldData,
      new_data: entry.newData,
    });
  } catch (err) {
    // Silently fail - audit logging should never break the main operation
    console.error("[writeAuditLog] Error:", err);
  }
}

export const auditActions = {
  auth: {
    signedIn: "user.signed_in",
    signedOut: "user.signed_out",
    passwordChanged: "user.password_changed",
    invited: "user.invited",
  },
  setup: {
    schoolYearCreated: "school_year.created",
    schoolYearUpdated: "school_year.updated",
    schoolYearDeleted: "school_year.deleted",
    schoolYearSetActive: "school_year.set_active",
    standardCreated: "standard.created",
    standardUpdated: "standard.updated",
    standardDeleted: "standard.deleted",
    divisionCreated: "division.created",
    divisionUpdated: "division.updated",
    divisionDeleted: "division.deleted",
    segmentCreated: "segment.created",
    segmentUpdated: "segment.updated",
    segmentDeleted: "segment.deleted",
    subjectCreated: "subject.created",
    subjectUpdated: "subject.updated",
    subjectDeleted: "subject.deleted",
    teacherCreated: "teacher.created",
    teacherUpdated: "teacher.updated",
    teacherDeleted: "teacher.deleted",
    chapterCreated: "chapter.created",
    chapterUpdated: "chapter.updated",
    chapterDeleted: "chapter.deleted",
    allocationCreated: "allocation.created",
    allocationDeleted: "allocation.deleted",
    branchCreated: "branch.created",
    branchUpdated: "branch.updated",
    branchDeleted: "branch.deleted",
  },
  timetable: {
    templateCreated: "template.created",
    templateUpdated: "template.updated",
    templateDeleted: "template.deleted",
    slotSaved: "timetable.slot_saved",
    slotCleared: "timetable.slot_cleared",
    finalized: "timetable.finalized",
    movedToDraft: "timetable.moved_to_draft",
    holidayCreated: "holiday.created",
    holidayDeleted: "holiday.deleted",
  },
  content: {
    lessonPlanUploaded: "lesson_plan.uploaded",
    lessonPlanPublished: "lesson_plan.published",
    lessonPlanUnpublished: "lesson_plan.unpublished",
    mcqSaved: "mcq.saved",
    testSaved: "test.saved",
  },
  operations: {
    periodLogged: "period.logged",
    periodEdited: "period.log_edited",
    absenceMarked: "teacher.absence_marked",
    absenceDeleted: "teacher.absence_deleted",
  },
};
