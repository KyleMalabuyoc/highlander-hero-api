import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { login } from "../controllers/authController.js";
import { getCourses, getMajors, getMinors } from "../controllers/courseController.js";
import { getSchedules } from "../controllers/scheduleController.js";

const router = Router();

// path, middleware, controller
router.post("/login", validate, login);

// schedules
router.get("/schedules", validate, getSchedules);

// courses
router.get("/courses", validate, getCourses);
router.get("/majors", validate, getMajors);
router.get("/minors", validate, getMinors);

export default router;