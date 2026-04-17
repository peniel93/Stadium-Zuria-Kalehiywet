"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePortalLocale } from "@/lib/portal-locale";

type Course = {
  id: string;
  code: string | null;
  title: string;
  description: string | null;
  course_status: "draft" | "open" | "closed";
  start_date: string | null;
  end_date: string | null;
};

type Participant = {
  id: string;
  full_name: string;
  participant_type: "teacher" | "student";
  education_level: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  status: "active" | "inactive";
};

type Grade = {
  id: string;
  course_id: string;
  student_participant_id: string;
  teacher_participant_id: string | null;
  assessment_title: string;
  score: number | null;
  grade_letter: string | null;
  remarks: string | null;
  course: Course | null;
  student: Participant | null;
  teacher: Participant | null;
};

type Assignment = {
  course_id: string;
  participant_id: string;
  role_in_course: "teacher" | "student";
};

export function TrainingManager() {
  const locale = usePortalLocale();
  const t = (en: string, am: string) => (locale === "am" ? am : en);
  const [courses, setCourses] = useState<Course[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [courseForm, setCourseForm] = useState({
    courseId: "",
    code: "",
    title: "",
    description: "",
    courseStatus: "draft" as "draft" | "open" | "closed",
    startDate: "",
    endDate: "",
  });

  const [participantForm, setParticipantForm] = useState({
    participantId: "",
    fullName: "",
    participantType: "student" as "teacher" | "student",
    educationLevel: "",
    contactPhone: "",
    contactEmail: "",
    status: "active" as "active" | "inactive",
  });

  const [assignmentForm, setAssignmentForm] = useState({
    courseId: "",
    participantId: "",
    roleInCourse: "student" as "teacher" | "student",
  });

  const [gradeForm, setGradeForm] = useState({
    gradeId: "",
    courseId: "",
    studentParticipantId: "",
    teacherParticipantId: "",
    assessmentTitle: "",
    score: "",
    gradeLetter: "",
    remarks: "",
  });

  const teachers = useMemo(
    () => participants.filter((item) => item.participant_type === "teacher"),
    [participants],
  );

  const students = useMemo(
    () => participants.filter((item) => item.participant_type === "student"),
    [participants],
  );

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const response = await fetch("/api/v1/training");
    const result = await response.json();

    if (result.success) {
      setCourses(result.data.courses ?? []);
      setParticipants(result.data.participants ?? []);
      setGrades(result.data.grades ?? []);
      setAssignments(result.data.assignments ?? []);
      setMessage(null);
    } else {
      setMessage(
        result.error?.message ??
          (locale === "am"
            ? "የስልጠና ዳሽቦርድ መጫን አልተሳካም።"
            : "Failed to load training dashboard."),
      );
    }

    setIsLoading(false);
  }, [locale]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadData]);

  async function send(entity: string, method: "POST" | "PATCH" | "DELETE", body: Record<string, unknown>, successMessage: string) {
    const response = await fetch("/api/v1/training", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity, ...body }),
    });

    const result = await response.json();

    if (!result.success) {
      setMessage(
        result.error?.message ??
          (locale === "am" ? "እርምጃው አልተሳካም።" : "Operation failed."),
      );
      return false;
    }

    setMessage(successMessage);
    await loadData();
    return true;
  }

  return (
    <section className="panel" style={{ display: "grid", gap: 16 }}>
      <div className="section-head">
        <h2 style={{ margin: 0 }}>{t("Training and Education Dashboard", "የስልጠና እና ትምህርት ዳሽቦርድ")}</h2>
        <button className="control-btn" type="button" onClick={() => void loadData()}>
          {t("Refresh", "አድስ")}
        </button>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void send(
            "course",
            courseForm.courseId ? "PATCH" : "POST",
            {
              courseId: courseForm.courseId || undefined,
              code: courseForm.code || undefined,
              title: courseForm.title,
              description: courseForm.description || undefined,
              courseStatus: courseForm.courseStatus,
              startDate: courseForm.startDate || null,
              endDate: courseForm.endDate || null,
            },
            courseForm.courseId ? "Course updated." : "Course created.",
          ).then((ok) => {
            if (ok) {
              setCourseForm({ courseId: "", code: "", title: "", description: "", courseStatus: "draft", startDate: "", endDate: "" });
            }
          });
        }}
        style={{ display: "grid", gap: 12 }}
      >
        <h3 style={{ margin: 0 }}>{t("Courses", "ኮርሶች")}</h3>
        <div className="admin-grid">
          <input className="portal-input" placeholder={t("Course code", "የኮርስ ኮድ")} value={courseForm.code} onChange={(event) => setCourseForm({ ...courseForm, code: event.target.value })} />
          <input className="portal-input" placeholder={t("Course title", "የኮርስ ርዕስ")} value={courseForm.title} onChange={(event) => setCourseForm({ ...courseForm, title: event.target.value })} />
        </div>
        <div className="admin-grid">
          <input className="portal-input" placeholder={t("Description", "መግለጫ")} value={courseForm.description} onChange={(event) => setCourseForm({ ...courseForm, description: event.target.value })} />
          <select className="portal-input" value={courseForm.courseStatus} onChange={(event) => setCourseForm({ ...courseForm, courseStatus: event.target.value as Course["course_status"] })}>
            <option value="draft">{t("Draft", "ረቂቅ")}</option>
            <option value="open">{t("Open", "ክፍት")}</option>
            <option value="closed">{t("Closed", "ዝግ")}</option>
          </select>
        </div>
        <div className="admin-grid">
          <input className="portal-input" type="date" value={courseForm.startDate} onChange={(event) => setCourseForm({ ...courseForm, startDate: event.target.value })} />
          <input className="portal-input" type="date" value={courseForm.endDate} onChange={(event) => setCourseForm({ ...courseForm, endDate: event.target.value })} />
        </div>
        <button className="control-btn" type="submit">{courseForm.courseId ? t("Update course", "ኮርስ አሻሽል") : t("Create course", "ኮርስ ፍጠር")}</button>
      </form>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void send(
            "participant",
            participantForm.participantId ? "PATCH" : "POST",
            {
              participantId: participantForm.participantId || undefined,
              fullName: participantForm.fullName,
              participantType: participantForm.participantType,
              educationLevel: participantForm.educationLevel || undefined,
              contactPhone: participantForm.contactPhone || undefined,
              contactEmail: participantForm.contactEmail || undefined,
              status: participantForm.status,
            },
            participantForm.participantId ? "Participant updated." : "Participant created.",
          ).then((ok) => {
            if (ok) {
              setParticipantForm({ participantId: "", fullName: "", participantType: "student", educationLevel: "", contactPhone: "", contactEmail: "", status: "active" });
            }
          });
        }}
        style={{ display: "grid", gap: 12 }}
      >
        <h3 style={{ margin: 0 }}>{t("Teachers and Students", "አስተማሪዎች እና ተማሪዎች")}</h3>
        <div className="admin-grid">
          <input className="portal-input" placeholder={t("Full name", "ሙሉ ስም")} value={participantForm.fullName} onChange={(event) => setParticipantForm({ ...participantForm, fullName: event.target.value })} />
          <select className="portal-input" value={participantForm.participantType} onChange={(event) => setParticipantForm({ ...participantForm, participantType: event.target.value as "teacher" | "student" })}>
            <option value="teacher">{t("Teacher", "አስተማሪ")}</option>
            <option value="student">{t("Student", "ተማሪ")}</option>
          </select>
        </div>
        <div className="admin-grid">
          <input className="portal-input" placeholder={t("Education level", "የትምህርት ደረጃ")} value={participantForm.educationLevel} onChange={(event) => setParticipantForm({ ...participantForm, educationLevel: event.target.value })} />
          <select className="portal-input" value={participantForm.status} onChange={(event) => setParticipantForm({ ...participantForm, status: event.target.value as "active" | "inactive" })}>
            <option value="active">{t("Active", "ንቁ")}</option>
            <option value="inactive">{t("Inactive", "የተቋረጠ")}</option>
          </select>
        </div>
        <div className="admin-grid">
          <input className="portal-input" placeholder={t("Phone", "ስልክ")} value={participantForm.contactPhone} onChange={(event) => setParticipantForm({ ...participantForm, contactPhone: event.target.value })} />
          <input className="portal-input" placeholder={t("Email", "ኢሜይል")} value={participantForm.contactEmail} onChange={(event) => setParticipantForm({ ...participantForm, contactEmail: event.target.value })} />
        </div>
        <button className="control-btn" type="submit">{participantForm.participantId ? t("Update participant", "ተሳታፊ አሻሽል") : t("Create participant", "ተሳታፊ ፍጠር")}</button>
      </form>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void send(
            "assignment",
            "POST",
            assignmentForm,
            "Participant assigned to course.",
          );
        }}
        style={{ display: "grid", gap: 12 }}
      >
        <h3 style={{ margin: 0 }}>{t("Course Assignment", "የኮርስ ምደባ")}</h3>
        <div className="admin-grid">
          <select className="portal-input" value={assignmentForm.courseId} onChange={(event) => setAssignmentForm({ ...assignmentForm, courseId: event.target.value })}>
            <option value="">{t("Select course", "ኮርስ ምረጥ")}</option>
            {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
          </select>
          <select className="portal-input" value={assignmentForm.participantId} onChange={(event) => setAssignmentForm({ ...assignmentForm, participantId: event.target.value })}>
            <option value="">{t("Select participant", "ተሳታፊ ምረጥ")}</option>
            {participants.map((participant) => <option key={participant.id} value={participant.id}>{participant.full_name}</option>)}
          </select>
        </div>
        <select className="portal-input" value={assignmentForm.roleInCourse} onChange={(event) => setAssignmentForm({ ...assignmentForm, roleInCourse: event.target.value as "teacher" | "student" })}>
          <option value="teacher">{t("Teacher", "አስተማሪ")}</option>
          <option value="student">{t("Student", "ተማሪ")}</option>
        </select>
        <button className="control-btn" type="submit">{t("Assign", "መድብ")}</button>
      </form>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void send(
            "grade",
            gradeForm.gradeId ? "PATCH" : "POST",
            {
              gradeId: gradeForm.gradeId || undefined,
              courseId: gradeForm.courseId,
              studentParticipantId: gradeForm.studentParticipantId,
              teacherParticipantId: gradeForm.teacherParticipantId || null,
              assessmentTitle: gradeForm.assessmentTitle,
              score: gradeForm.score ? Number(gradeForm.score) : null,
              gradeLetter: gradeForm.gradeLetter || undefined,
              remarks: gradeForm.remarks || undefined,
            },
            gradeForm.gradeId ? "Grade updated." : "Grade posted.",
          ).then((ok) => {
            if (ok) {
              setGradeForm({ gradeId: "", courseId: "", studentParticipantId: "", teacherParticipantId: "", assessmentTitle: "", score: "", gradeLetter: "", remarks: "" });
            }
          });
        }}
        style={{ display: "grid", gap: 12 }}
      >
        <h3 style={{ margin: 0 }}>{t("Assessments and Grades", "ምዘናዎች እና ውጤቶች")}</h3>
        <div className="admin-grid">
          <select className="portal-input" value={gradeForm.courseId} onChange={(event) => setGradeForm({ ...gradeForm, courseId: event.target.value })}>
            <option value="">{t("Select course", "ኮርስ ምረጥ")}</option>
            {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
          </select>
          <input className="portal-input" placeholder={t("Assessment title", "የምዘና ርዕስ")} value={gradeForm.assessmentTitle} onChange={(event) => setGradeForm({ ...gradeForm, assessmentTitle: event.target.value })} />
        </div>
        <div className="admin-grid">
          <select className="portal-input" value={gradeForm.studentParticipantId} onChange={(event) => setGradeForm({ ...gradeForm, studentParticipantId: event.target.value })}>
            <option value="">{t("Select student", "ተማሪ ምረጥ")}</option>
            {students.map((student) => <option key={student.id} value={student.id}>{student.full_name}</option>)}
          </select>
          <select className="portal-input" value={gradeForm.teacherParticipantId} onChange={(event) => setGradeForm({ ...gradeForm, teacherParticipantId: event.target.value })}>
            <option value="">{t("Select teacher", "አስተማሪ ምረጥ")}</option>
            {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>)}
          </select>
        </div>
        <div className="admin-grid">
          <input className="portal-input" type="number" placeholder={t("Score", "ነጥብ")} value={gradeForm.score} onChange={(event) => setGradeForm({ ...gradeForm, score: event.target.value })} />
          <input className="portal-input" placeholder={t("Grade letter", "የፊደል ውጤት")} value={gradeForm.gradeLetter} onChange={(event) => setGradeForm({ ...gradeForm, gradeLetter: event.target.value })} />
        </div>
        <input className="portal-input" placeholder={t("Remarks", "ማስታወሻ")} value={gradeForm.remarks} onChange={(event) => setGradeForm({ ...gradeForm, remarks: event.target.value })} />
        <button className="control-btn" type="submit">{gradeForm.gradeId ? t("Update grade", "ውጤት አሻሽል") : t("Post grade", "ውጤት ለጥፍ")}</button>
      </form>

      {message ? <p style={{ margin: 0, color: "var(--accent-strong)" }}>{message}</p> : null}
      {isLoading ? <p>{t("Loading training dashboard...", "የስልጠና ዳሽቦርድ በመጫን ላይ...")}</p> : null}

      <div className="card-grid">
        {courses.map((course) => (
          <article key={course.id} className="content-card">
            <div className="tag-row"><span className="tag">{course.course_status}</span><span>{course.code ?? t("No code", "ኮድ የለም")}</span></div>
            <h3>{course.title}</h3>
            <p>{course.description ?? t("No description", "መግለጫ የለም")}</p>
            <p>{course.start_date ?? t("No start", "መጀመሪያ የለም")} - {course.end_date ?? t("No end", "መጨረሻ የለም")}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="control-btn" type="button" onClick={() => setCourseForm({ courseId: course.id, code: course.code ?? "", title: course.title, description: course.description ?? "", courseStatus: course.course_status, startDate: course.start_date ?? "", endDate: course.end_date ?? "" })}>{t("Edit", "አሻሽል")}</button>
              <button className="control-btn" type="button" onClick={() => void send("course", "DELETE", { courseId: course.id }, t("Course deleted.", "ኮርሱ ተሰርዟል።"))}>{t("Delete", "ሰርዝ")}</button>
            </div>
          </article>
        ))}
      </div>

      <div className="card-grid">
        {participants.map((participant) => (
          <article key={participant.id} className="content-card">
            <div className="tag-row"><span className="tag">{participant.participant_type}</span><span>{participant.status}</span></div>
            <h3>{participant.full_name}</h3>
            <p>{participant.education_level ?? t("No education level", "የትምህርት ደረጃ የለም")}</p>
            <p>{participant.contact_phone ?? t("No phone", "ስልክ የለም")} | {participant.contact_email ?? t("No email", "ኢሜይል የለም")}</p>
            <p>
              {t("Assigned courses", "የተመደቡ ኮርሶች")}: {assignments.filter((item) => item.participant_id === participant.id).length}
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="control-btn" type="button" onClick={() => setParticipantForm({ participantId: participant.id, fullName: participant.full_name, participantType: participant.participant_type, educationLevel: participant.education_level ?? "", contactPhone: participant.contact_phone ?? "", contactEmail: participant.contact_email ?? "", status: participant.status })}>{t("Edit", "አሻሽል")}</button>
              <button className="control-btn" type="button" onClick={() => void send("participant", "DELETE", { participantId: participant.id }, t("Participant deleted.", "ተሳታፊው ተሰርዟል።"))}>{t("Delete", "ሰርዝ")}</button>
            </div>
          </article>
        ))}
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {grades.map((grade) => (
          <article key={grade.id} className="content-card">
            <div className="tag-row"><span className="tag">{grade.assessment_title}</span><span>{grade.course?.title ?? t("No course", "ኮርስ የለም")}</span></div>
            <h3>{grade.student?.full_name ?? t("Unknown student", "ያልታወቀ ተማሪ")}</h3>
            <p>{t("Teacher", "አስተማሪ")}: {grade.teacher?.full_name ?? "N/A"}</p>
            <p>{t("Score", "ነጥብ")}: {grade.score ?? "N/A"} | {t("Grade", "ውጤት")}: {grade.grade_letter ?? "N/A"}</p>
            <p>{grade.remarks ?? t("No remarks", "ማስታወሻ የለም")}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="control-btn" type="button" onClick={() => setGradeForm({ gradeId: grade.id, courseId: grade.course_id, studentParticipantId: grade.student_participant_id, teacherParticipantId: grade.teacher_participant_id ?? "", assessmentTitle: grade.assessment_title, score: grade.score !== null ? String(grade.score) : "", gradeLetter: grade.grade_letter ?? "", remarks: grade.remarks ?? "" })}>{t("Edit", "አሻሽል")}</button>
              <button className="control-btn" type="button" onClick={() => void send("grade", "DELETE", { gradeId: grade.id }, t("Grade deleted.", "ውጤቱ ተሰርዟል።"))}>{t("Delete", "ሰርዝ")}</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
