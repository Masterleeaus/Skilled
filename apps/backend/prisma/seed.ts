import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { validateLocalDemoSeedTarget } from "./local-demo-seed-guard";

/*
 * SAFETY GUARDS. Read before running this script.
 *
 * This script deletes every row in every table (wipeDatabase) before it seeds demo data.
 * It exits with status 1, before a database connection is opened, unless all of these hold:
 *   1. NODE_ENV must explicitly be development or test. Staging and production are refused.
 *   2. DATABASE_URL must point to a loopback PostgreSQL host and a non-system, non-titan_academy database.
 *   3. The run is confirmed with the flag --confirm-wipe, or with SEED_CONFIRM_WIPE=1.
 * Before the wipe starts, the script prints the host, port and database name from DATABASE_URL.
 * Check that line. The password is never printed.
 *
 * Example (throwaway local database only):
 *   pnpm -C apps/backend exec tsx prisma/seed.ts --confirm-wipe
 */
let target: { host: string; name: string };
try {
  target = validateLocalDemoSeedTarget(process.env, process.argv.slice(2));
} catch (error) {
  console.error(`seed refused: ${error instanceof Error ? error.message : "invalid target"}`);
  process.exit(1);
}
console.log(`Local demo target database: host=${target.host} name=${target.name}`);

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Password123!";

async function wipeDatabase() {
  console.log("Wiping existing data...");

  // Delete in FK-safe order (children before parents)
  await prisma.auditLog.deleteMany();
  await prisma.discussionReply.deleteMany();
  await prisma.discussionThread.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.review.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.liveClass.deleteMany();
  await prisma.assignmentSubmission.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.answer.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.option.deleteMany();
  await prisma.question.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.lessonProgress.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.module.deleteMany();
  await prisma.course.deleteMany();
  await prisma.category.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  console.log("Database wiped.");
}

async function seed() {
  await wipeDatabase();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  console.log("Creating demo users...");

  const admin = await prisma.user.create({
    data: {
      fullName: "Demo Admin",
      email: "admin@skilled.local",
      passwordHash,
      role: "ADMIN",
      isEmailVerified: true,
    },
  });

  const teacher = await prisma.user.create({
    data: {
      fullName: "Demo Teacher",
      email: "teacher@skilled.local",
      passwordHash,
      role: "TEACHER",
      isEmailVerified: true,
    },
  });

  const student = await prisma.user.create({
    data: {
      fullName: "Demo Learner",
      email: "student@skilled.local",
      passwordHash,
      role: "STUDENT",
      isEmailVerified: true,
    },
  });

  console.log("Creating demo category + course...");

  const category = await prisma.category.create({
    data: { name: "Web Development", slug: "web-development" },
  });

  const course = await prisma.course.create({
    data: {
      title: "Demo course: Node.js basics",
      slug: "nodejs-masterclass",
      description: "Local demo fixture for the inherited course model. It is not approved SkilledAt.Work curriculum.",
      categoryId: category.id,
      teacherId: teacher.id,
      price: 0,
      level: "BEGINNER",
      // Demo fixture, not curriculum. It uses the legacy Lesson model and creates no AcademyContentLesson,
      // AcademyLessonRevision or track, so no unreviewed curriculum is published by this seed.
      isPublished: true,
    },
  });

  const module1 = await prisma.module.create({
    data: { courseId: course.id, title: "Getting Started", orderIndex: 0 },
  });

  await prisma.lesson.create({
    data: {
      moduleId: module1.id,
      title: "Welcome to the demo course",
      isFreePreview: true,
      orderIndex: 0,
    },
  });

  await prisma.lesson.create({
    data: {
      moduleId: module1.id,
      title: "Demo setup notes",
      orderIndex: 1,
    },
  });

  await prisma.enrollment.create({
    data: { studentId: student.id, courseId: course.id },
  });

  console.log("\nSeed complete. Demo accounts (all share the same password):\n");
  console.log(`  Password: ${DEMO_PASSWORD}\n`);
  console.table([
    { role: "ADMIN", email: admin.email },
    { role: "TEACHER", email: teacher.email },
    { role: "STUDENT", email: student.email },
  ]);
}

seed()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
