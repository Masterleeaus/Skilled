import { api } from "@/lib/api-client";

export interface AssignmentSummary {
  id: string;
  title: string;
  instructions: string;
  dueDate: string;
  totalMarks: number;
  passingMarks: number | null;
}

export interface Submission {
  id: string;
  text: string | null;
  attachments: { key: string; name: string }[];
  submittedAt: string;
  marksObtained: number | null;
  feedback: string | null;
  status: "SUBMITTED" | "LATE" | "GRADED";
  student?: { id: string; fullName: string; email: string };
}

export async function fetchAssignmentsForCourse(courseId: string) {
  const { data } = await api.get(`/assignments/course/${courseId}`);
  return data.data as AssignmentSummary[];
}

export async function fetchMySubmission(assignmentId: string) {
  const { data } = await api.get(`/assignments/${assignmentId}/my-submission`);
  return data.data as Submission | null;
}

export async function submitAssignment(assignmentId: string, text: string, files: File[]) {
  const formData = new FormData();
  if (text) formData.append("text", text);
  files.forEach((f) => formData.append("attachments", f));

  const { data } = await api.post(`/assignments/${assignmentId}/submit`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.data as Submission;
}

export async function fetchSubmissions(assignmentId: string) {
  const { data } = await api.get(`/assignments/${assignmentId}/submissions`);
  return data.data as Submission[];
}

export async function gradeSubmission(submissionId: string, marksObtained: number, feedback: string) {
  const { data } = await api.patch(`/assignments/submissions/${submissionId}/grade`, {
    marksObtained,
    feedback,
  });
  return data.data as Submission;
}

export async function updateAssignmentPassingMarks(assignmentId: string, passingMarks: number) {
  const { data } = await api.patch(`/assignments/${assignmentId}/passing-marks`, { passingMarks });
  return data.data as AssignmentSummary;
}
