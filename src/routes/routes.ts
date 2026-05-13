import { Router } from "express";
import * as auth from "../controllers/AuthController.js";
import { getCourses, getMajors, getMinors } from "../controllers/AcademicsController.js";
import { getSchedules, createNewSchedule, llmEditNewSchedule, updateSchedule } from "../controllers/ScheduleController.js";
import { validateAccess } from "../middleware/authenticate.js";
import { rateLimitMiddleware } from "../middleware/ratelimit.js";

const router = Router();
const authPrefix = '/auth';

// Authentication
router.post(authPrefix + "/login", auth.login);
router.post(authPrefix + "/register", auth.register);
router.post(authPrefix + "/confirm", auth.confirm);
router.post(authPrefix + "/resend", auth.resendCode);
router.post(authPrefix + "/cancel", auth.cancel);
router.get(authPrefix + "/logout", validateAccess, auth.logout);
router.get(authPrefix + "/refresh", auth.refresh);

// Schedules
router.get("/schedules", validateAccess, getSchedules);
router.post("/new/schedule", validateAccess, createNewSchedule);
router.post("/llm/edit/schedule", rateLimitMiddleware, validateAccess, llmEditNewSchedule);
router.post("/update/schedule", rateLimitMiddleware, validateAccess, updateSchedule)


// Courses / Majors / Minors
router.get("/courses", validateAccess, getCourses);
router.get("/majors", validateAccess, getMajors);
router.get("/minors", validateAccess, getMinors);

export default router;