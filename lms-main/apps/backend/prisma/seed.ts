import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

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
      fullName: "Admin User",
      email: "admin@lms.local",
      passwordHash,
      role: "ADMIN",
      isEmailVerified: true,
    },
  });

  const teacher = await prisma.user.create({
    data: {
      fullName: "Teacher One",
      email: "teacher@lms.local",
      passwordHash,
      role: "TEACHER",
      isEmailVerified: true,
    },
  });

  const student = await prisma.user.create({
    data: {
      fullName: "Student One",
      email: "student@lms.local",
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
      title: "Node.js Masterclass",
      slug: "nodejs-masterclass",
      description: "Learn backend development with Node.js, Express, and Prisma from scratch.",
      categoryId: category.id,
      teacherId: teacher.id,
      price: 0,
      level: "BEGINNER",
      isPublished: true,
    },
  });

  const module1 = await prisma.module.create({
    data: { courseId: course.id, title: "Getting Started", orderIndex: 0 },
  });

  await prisma.lesson.create({
    data: {
      moduleId: module1.id,
      title: "Welcome to the course",
      isFreePreview: true,
      orderIndex: 0,
    },
  });

  await prisma.lesson.create({
    data: {
      moduleId: module1.id,
      title: "Setting up your environment",
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
