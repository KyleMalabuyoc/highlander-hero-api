import { Router } from "express";
import { validate } from "../middleware/validate.js";
import * as auth from "../controllers/AuthController.js";
import { getCourses, getMajors, getMinors } from "../controllers/CourseController.js";
import { getSchedules } from "../controllers/ScheduleController.js";
import * as users from "../controllers/UsersController.js";
import { validateAccess } from "../middleware/authenticate.js";

const router = Router();
const authPrefix = '/auth';
const usersPrefix = '/users'
const appPrefix = '/app'

// Authentication
router.post(authPrefix + "/login", auth.login);
router.post(authPrefix + "/register", auth.register);
router.post(authPrefix + "/refresh", auth.refresh);
router.post(authPrefix + "/confirm", auth.confirm);
router.post(authPrefix + "/resend", auth.resendCode);
router.post(authPrefix + "/cancel", auth.cancel);
router.post(authPrefix + "/logout", auth.logout);

// Users
router.post(usersPrefix + "/me", validateAccess, users.userInfo);

// Schedules
router.get(appPrefix + "/schedules", validateAccess, getSchedules);

// Courses / Majors / Minors
router.get(appPrefix + "/courses", validateAccess, getCourses);
router.get(appPrefix + "/majors", validateAccess, getMajors);
router.get(appPrefix + "/minors", validateAccess, getMinors);

export default router;