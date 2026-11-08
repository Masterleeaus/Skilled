import express from "express";
import { handleStripeWebhook } from "./modules/payments/stripe.webhook";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import { env } from "./config/env";
import { httpLogStream } from "./config/logger";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

import healthRoute from "./routes/health.route";
import authRoutes from "./modules/auth/auth.routes";
import categoryRoutes from "./modules/courses/category.routes";
import courseRoutes from "./modules/courses/course.routes";
import moduleRoutes from "./modules/courses/module.routes";
import enrollmentRoutes from "./modules/enrollment/enrollment.routes";
import quizRoutes from "./modules/quizzes/quiz.routes";
import assignmentRoutes from "./modules/assignments/assignment.routes";
import classRoutes from "./modules/classes/class.routes";
import certificateRoutes from "./modules/certificates/certificate.routes";
import reviewRoutes from "./modules/reviews/review.routes";
import paymentRoutes from "./modules/payments/payment.routes";
import auditRoutes from "./modules/audit/audit.routes";
import discussionRoutes from "./modules/discussions/discussion.routes";
import adminRoutes from "./modules/admin/admin.routes";
import curriculumRoutes from "./modules/curriculum/curriculum.routes";
import completionReportRoutes from "./modules/curriculum/completion-report.routes";
import { integrationRoutes } from "./modules/curriculum/integration.routes";
import courseSelectionRoutes from "./modules/course-selection/course-selection.routes";
import pathwayRoutes from "./modules/pathways/pathway.routes";
import templateRoutes from "./modules/templates/template.routes";

export const app = express();

// Trust forwarded client IPs only from Apache on the loopback interface.
// Do not use an unrestricted `trust proxy` setting on a publicly reachable API.
app.set("trust proxy", "loopback");

app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(cookieParser());
// Verify Stripe signatures against the untouched raw body BEFORE JSON parsing.
// This endpoint is deliberately registered outside the regular payments router.
app.post("/api/payments/stripe/webhook", express.raw({ type: "application/json", limit: "1mb" }), handleStripeWebhook);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("combined", { stream: httpLogStream }));

app.use("/api", healthRoute);
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/courses", moduleRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/audit-logs", auditRoutes);
app.use("/api/discussions", discussionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/academy/curriculum", curriculumRoutes);
app.use("/api/academy/templates", templateRoutes);
app.use("/api/academy/curriculum", completionReportRoutes);
app.use("/api/titan/integration", integrationRoutes);
app.use("/api/academy/pathways", pathwayRoutes);
app.use("/api/academy/course-selection", courseSelectionRoutes);
if (process.env.TUTOR_ENABLED === "true") require("./tutor/route/tutor-wiring.js").mountTutorRoute(app); // TUTOR_ENABLED defaults to off; the tutor module is not loaded otherwise.

app.use(notFoundHandler);
app.use(errorHandler);
