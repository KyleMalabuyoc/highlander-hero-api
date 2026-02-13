import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { getSchedules } from "../controllers/scheduleController.js";
import { login } from "../controllers/authController.js";

const router = Router();

// path, middleware, controller
router.get("/schedules", validate, getSchedules);
router.post("/login", validate, login);

export default router;