import { api } from "@/lib/api-client";

export interface LiveClass {
  id: string;
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  meetingLink: string | null;
  recordingUrl: string | null;
  status: "SCHEDULED" | "LIVE" | "ENDED" | "CANCELLED";
}

export interface AttendanceRecord {
  id: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  liveClass: { title: string; scheduledAt: string };
}

export async function fetchLiveClassesForCourse(courseId: string) {
  const { data } = await api.get(`/classes/course/${courseId}`);
  return data.data as LiveClass[];
}

export async function createLiveClass(input: {
  courseId: string;
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  meetingLink?: string;
}) {
  const { data } = await api.post("/classes", input);
  return data.data as LiveClass;
}

export async function updateLiveClassStatus(id: string, status: LiveClass["status"]) {
  const { data } = await api.patch(`/classes/${id}/status`, { status });
  return data.data as LiveClass;
}

export async function fetchMyAttendance(courseId: string) {
  const { data } = await api.get(`/classes/course/${courseId}/my-attendance`);
  return data.data as AttendanceRecord[];
}

export interface StudentForAttendance {
  id: string;
  fullName: string;
}

export async function fetchEnrolledStudents(courseId: string) {
  const { data } = await api.get(`/enrollments/course/${courseId}/students`);
  return data.data as StudentForAttendance[];
}

export interface RosterEntry {
  student: { id: string; fullName: string; email: string };
  progressPercentage: number;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  enrolledAt: string;
  quizzesAttempted: number;
  totalQuizzes: number;
  assignmentsSubmitted: number;
  totalAssignments: number;
  avgQuizScore: number | null;
}

export async function fetchCourseRoster(courseId: string) {
  const { data } = await api.get(`/enrollments/course/${courseId}/roster`);
  return data.data as RosterEntry[];
}

export interface StudentDetailForCourse {
  student: { id: string; fullName: string; email: string; avatarUrl: string | null };
  enrollment: { progressPercentage: number; status: string; enrolledAt: string };
  quizAttempts: {
    id: string;
    status: string;
    marksObtained: number | null;
    quiz: { title: string; totalMarks: number };
  }[];
  submissions: {
    id: string;
    status: string;
    marksObtained: number | null;
    feedback: string | null;
    assignment: { title: string; totalMarks: number };
  }[];
}

export async function fetchStudentDetailForCourse(courseId: string, studentId: string) {
  const { data } = await api.get(`/enrollments/course/${courseId}/students/${studentId}`);
  return data.data as StudentDetailForCourse;
}

export async function markAttendance(
  liveClassId: string,
  records: { studentId: string; status: AttendanceRecord["status"] }[],
) {
  const { data } = await api.post(`/classes/${liveClassId}/attendance`, { records });
  return data.data;
}
