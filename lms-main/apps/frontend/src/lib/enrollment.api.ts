import { api } from "@/lib/api-client";

export interface MyEnrollment {
  id: string;
  progressPercentage: number;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  /** The licence track saved at enrolment. */
  licenceTrack: "non-licensed" | "licensed";
  enrolledAt: string;
  course: {
    id: string;
    title: string;
    slug: string;
    thumbnailUrl: string | null;
    teacher: { fullName: string };
  };
}

export async function fetchMyEnrollments() {
  const { data } = await api.get("/enrollments/my-courses");
  return data.data as MyEnrollment[];
}

/** Saves a new licence track on the learner's own enrolment. Progress and completions are kept by the server. */
export async function setEnrolmentLicenceTrack(courseId: string, licenceTrack: MyEnrollment["licenceTrack"]) {
  const { data } = await api.patch(`/enrollments/${encodeURIComponent(courseId)}/licence-track`, { licenceTrack });
  return data.data as { courseId: string; licenceTrack: MyEnrollment["licenceTrack"] };
}
