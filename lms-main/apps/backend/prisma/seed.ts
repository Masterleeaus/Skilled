import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

/*
 * SAFETY GUARDS. Read before running this script.
 *
 * This script deletes every row in every table (wipeDatabase) before it seeds demo data.
 * It exits with status 1, before a database connection is opened, unless all of these hold:
 *   1. NODE_ENV is not "production". This is refused outright. There is no override.
 *   2. The run is confirmed with the flag --confirm-wipe, or with SEED_CONFIRM_WIPE=1.
 * Before the wipe starts, the script prints the host, port and database name from DATABASE_URL.
 * Check that line. The password is never printed.
 *
 * Example (throwaway local database only):
 *   pnpm -C apps/backend exec tsx prisma/seed.ts --confirm-wipe
 */
const CONFIRM_FLAG = "--confirm-wipe";
const CONFIRM_ENV = "SEED_CONFIRM_WIPE";

function refuse(message: string): never {
  console.error(`seed refused: ${message}`);
  process.exit(1);
}

function describeTarget(databaseUrl: string | undefined): { host: string; name: string } {
  if (!databaseUrl) refuse("DATABASE_URL is not set, so the target database cannot be identified.");
  let url: URL;
  try {
    url = new URL(databaseUrl);
  } catch {
    refuse("DATABASE_URL is not a valid URL. Its value is not printed.");
  }
  const host = url.port ? `${url.hostname}:${url.port}` : url.hostname;
  const name = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!name) refuse("DATABASE_URL has no database name.");
  return { host, name };
}

if (process.env.NODE_ENV === "production") {
  refuse("NODE_ENV is production. This script wipes the database and must never run against production.");
}

if (!process.argv.includes(CONFIRM_FLAG) && process.env[CONFIRM_ENV] !== "1") {
  refuse(
    `this script deletes all data. Confirm with ${CONFIRM_FLAG} (for example: ` +
      `pnpm -C apps/backend exec tsx prisma/seed.ts ${CONFIRM_FLAG}) or set ${CONFIRM_ENV}=1.`,
  );
}

const target = describeTarget(process.env.DATABASE_URL);
console.log(`Target database: host=${target.host} name=${target.name}`);

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
      description: "Local demo fixture for the legacy course model. It is not Titan Academy curriculum.",
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
