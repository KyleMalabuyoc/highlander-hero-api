import { Router } from "express";
import * as auth from "../controllers/authController.js";
import { getCourses, getMajors, getMinors } from "../controllers/AcademicsController.js";
import { getSchedules, createNewSchedule, llmEditNewSchedule, updateSchedule } from "../controllers/scheduleController.js";
import { validateAccess } from "../middleware/authenticate.js";
import { rateLimitMiddleware } from "../middleware/ratelimit.js";
import {
    validateCancel,
    validateConfirm,
    validateEditSchedule,
    validateLogin,
    validateNewSchedule,
    validateRegister,
    validateResend,
    validateUpdateSchedule,
} from "../middleware/validate.js";

const router = Router();
const authPrefix = '/auth';

// Authentication
router.post(authPrefix + "/login", rateLimitMiddleware, validateLogin, auth.login);
router.post(authPrefix + "/register", rateLimitMiddleware, validateRegister, auth.register);
router.post(authPrefix + "/confirm", rateLimitMiddleware, validateConfirm, auth.confirm);
router.post(authPrefix + "/resend", rateLimitMiddleware, validateResend,auth.resendCode);
router.post(authPrefix + "/cancel", rateLimitMiddleware, validateCancel, auth.cancel);
router.get(authPrefix + "/logout", rateLimitMiddleware, validateAccess, auth.logout);
router.get(authPrefix + "/refresh", auth.refresh);

// Schedules
router.get("/schedules", validateAccess, getSchedules);
router.post("/new/schedule", validateAccess, rateLimitMiddleware, validateNewSchedule, createNewSchedule);
router.post("/llm/edit/schedule", validateAccess, rateLimitMiddleware, validateEditSchedule, llmEditNewSchedule);
router.post("/update/schedule", validateAccess, rateLimitMiddleware, validateUpdateSchedule, updateSchedule);

// Courses / Majors / Minors
router.get("/courses", validateAccess, getCourses);
router.get("/majors", validateAccess, getMajors);
router.get("/minors", validateAccess, getMinors);

export default router;