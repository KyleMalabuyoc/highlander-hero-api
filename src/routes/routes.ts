import { Router } from "express";
import * as auth from "../controllers/AuthController.js";
import { getCourses, getMajors, getMinors } from "../controllers/AcademicsController.js";
import { getSchedules, createNewSchedule, editNewSchedule } from "../controllers/ScheduleController.js";
import { validateAccess } from "../middleware/authenticate.js";

const router = Router();
const authPrefix = '/auth';

// Authentication
router.post(authPrefix + "/login", auth.login);
router.post(authPrefix + "/register", auth.register);
router.post(authPrefix + "/refresh", auth.refresh);
router.post(authPrefix + "/confirm", auth.confirm);
router.post(authPrefix + "/resend", auth.resendCode);
router.post(authPrefix + "/cancel", auth.cancel);
router.post(authPrefix + "/logout", auth.logout);

// Schedules
router.get("/schedules", validateAccess, getSchedules);
router.post("/new/schedule", validateAccess, createNewSchedule);
router.post("/edit/schedule", validateAccess, editNewSchedule);

// Courses / Majors / Minors
router.get("/courses", validateAccess, getCourses);
router.get("/majors", validateAccess, getMajors);
router.get("/minors", validateAccess, getMinors);

export default router;