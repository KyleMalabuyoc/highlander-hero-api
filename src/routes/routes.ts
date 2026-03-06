import { Router } from "express";
import { validate } from "../middleware/validate.js";
import * as auth from "../controllers/authController.js";
import { getCourses, getMajors, getMinors } from "../controllers/courseController.js";
import { getSchedules } from "../controllers/scheduleController.js";

const router = Router();
const authPrefix = '/auth';
const appPrefix = '/app'

// path, middleware, controller
router.post(authPrefix + "/login", validate, auth.login);
router.post(authPrefix + "/register", validate, auth.register);
router.post(authPrefix + "/refresh", validate, auth.refresh);
router.post(authPrefix + "/confirm", validate, auth.confirm);
router.post(authPrefix + "/resend", validate, auth.resendCode);
router.post(authPrefix + "/logout", validate, auth.logout);

// schedules
router.get(appPrefix + "/schedules", validate, getSchedules);

// courses
router.get(appPrefix + "/courses", validate, getCourses);
router.get(appPrefix + "/majors", validate, getMajors);
router.get(appPrefix + "/minors", validate, getMinors);

export default router;