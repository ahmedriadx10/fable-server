import { Router } from "express";
import { sendWelcomeEmail } from "../controllers/email.controller.js";

const router = Router();

// POST /welcome-user — send welcome email to newly registered user
router.post("/welcome-user", sendWelcomeEmail);

export default router;
