import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadMediaPreviewMap } from "@/lib/supabase/media-preview";

export async function listTrainingDashboard() {
  const supabase = await createSupabaseServerClient();

  const [{ data: courses, error: coursesError }, { data: participants, error: participantsError }, { data: grades, error: gradesError }, { data: assignments, error: assignmentsError }] =
    await Promise.all([
      supabase.from("training_courses").select("*").order("created_at", { ascending: false }),
      supabase.from("training_participants").select("*").order("created_at", { ascending: false }),
      supabase.from("training_grades").select("*").order("created_at", { ascending: false }),
      supabase
        .from("training_course_participants")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

  if (coursesError) throw new Error(coursesError.message);
  if (participantsError) throw new Error(participantsError.message);
  if (gradesError) throw new Error(gradesError.message);
  if (assignmentsError) throw new Error(assignmentsError.message);

  const participantRows = participants ?? [];
  const previewMap = await loadMediaPreviewMap(participantRows.map((row) => row.photo_media_id));

  const participantMap = new Map(participantRows.map((item) => [item.id, item]));
  const courseMap = new Map((courses ?? []).map((item) => [item.id, item]));

  return {
    courses: courses ?? [],
    participants: participantRows.map((row) => ({
      ...row,
      photo_media_preview_url: previewMap.get(row.photo_media_id ?? "")?.previewUrl ?? null,
    })),
    assignments: assignments ?? [],
    grades: (grades ?? []).map((grade) => ({
      ...grade,
      course: courseMap.get(grade.course_id) ?? null,
      student: participantMap.get(grade.student_participant_id) ?? null,
      teacher: participantMap.get(grade.teacher_participant_id ?? "") ?? null,
    })),
  };
}

export async function createTrainingCourse(input: {
  code?: string;
  title: string;
  description?: string;
  courseStatus?: "draft" | "open" | "closed";
  startDate?: string | null;
  endDate?: string | null;
}) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("training_courses")
    .insert({
      code: input.code || null,
      title: input.title,
      description: input.description ?? null,
      course_status: input.courseStatus ?? "draft",
      start_date: input.startDate ?? null,
      end_date: input.endDate ?? null,
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to create course.");
  return data;
}

export async function updateTrainingCourse(
  courseId: string,
  input: {
    code?: string;
    title: string;
    description?: string;
    courseStatus?: "draft" | "open" | "closed";
    startDate?: string | null;
    endDate?: string | null;
  },
) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("training_courses")
    .update({
      code: input.code || null,
      title: input.title,
      description: input.description ?? null,
      course_status: input.courseStatus ?? "draft",
      start_date: input.startDate ?? null,
      end_date: input.endDate ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", courseId)
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to update course.");
  return data;
}

export async function deleteTrainingCourse(courseId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("training_courses").delete().eq("id", courseId);
  if (error) throw new Error(error.message);
  return { courseId };
}

export async function createTrainingParticipant(input: {
  fullName: string;
  participantType: "teacher" | "student";
  educationLevel?: string;
  contactPhone?: string;
  contactEmail?: string;
  photoMediaId?: string | null;
  status?: "active" | "inactive";
}) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("training_participants")
    .insert({
      full_name: input.fullName,
      participant_type: input.participantType,
      education_level: input.educationLevel ?? null,
      contact_phone: input.contactPhone ?? null,
      contact_email: input.contactEmail ?? null,
      photo_media_id: input.photoMediaId ?? null,
      status: input.status ?? "active",
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to create participant.");
  return data;
}

export async function updateTrainingParticipant(
  participantId: string,
  input: {
    fullName: string;
    participantType: "teacher" | "student";
    educationLevel?: string;
    contactPhone?: string;
    contactEmail?: string;
    photoMediaId?: string | null;
    status?: "active" | "inactive";
  },
) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("training_participants")
    .update({
      full_name: input.fullName,
      participant_type: input.participantType,
      education_level: input.educationLevel ?? null,
      contact_phone: input.contactPhone ?? null,
      contact_email: input.contactEmail ?? null,
      photo_media_id: input.photoMediaId ?? null,
      status: input.status ?? "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", participantId)
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to update participant.");
  return data;
}

export async function deleteTrainingParticipant(participantId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("training_participants").delete().eq("id", participantId);
  if (error) throw new Error(error.message);
  return { participantId };
}

export async function assignTrainingParticipant(input: {
  courseId: string;
  participantId: string;
  roleInCourse: "teacher" | "student";
}) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("training_course_participants")
    .upsert({
      course_id: input.courseId,
      participant_id: input.participantId,
      role_in_course: input.roleInCourse,
      created_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to assign participant.");
  return data;
}

export async function removeTrainingAssignment(input: { courseId: string; participantId: string }) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("training_course_participants")
    .delete()
    .eq("course_id", input.courseId)
    .eq("participant_id", input.participantId);

  if (error) throw new Error(error.message);
  return input;
}

export async function createTrainingGrade(input: {
  courseId: string;
  studentParticipantId: string;
  teacherParticipantId?: string | null;
  assessmentTitle: string;
  score?: number | null;
  gradeLetter?: string;
  remarks?: string;
}) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("training_grades")
    .insert({
      course_id: input.courseId,
      student_participant_id: input.studentParticipantId,
      teacher_participant_id: input.teacherParticipantId ?? null,
      assessment_title: input.assessmentTitle,
      score: input.score ?? null,
      grade_letter: input.gradeLetter ?? null,
      remarks: input.remarks ?? null,
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to create grade.");
  return data;
}

export async function updateTrainingGrade(
  gradeId: string,
  input: {
    courseId: string;
    studentParticipantId: string;
    teacherParticipantId?: string | null;
    assessmentTitle: string;
    score?: number | null;
    gradeLetter?: string;
    remarks?: string;
  },
) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("training_grades")
    .update({
      course_id: input.courseId,
      student_participant_id: input.studentParticipantId,
      teacher_participant_id: input.teacherParticipantId ?? null,
      assessment_title: input.assessmentTitle,
      score: input.score ?? null,
      grade_letter: input.gradeLetter ?? null,
      remarks: input.remarks ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", gradeId)
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to update grade.");
  return data;
}

export async function deleteTrainingGrade(gradeId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("training_grades").delete().eq("id", gradeId);
  if (error) throw new Error(error.message);
  return { gradeId };
}
