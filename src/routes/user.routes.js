import { Router } from "express";
import {
  updateUserRole,
  getUserDashboardStats,
} from "../controllers/user.controller.js";
import { authorizationMiddleware } from "../middleware/auth.middleware.js";
import { verifyUserRoleMiddleware } from "../middleware/role.middleware.js";

const router = Router();

// PATCH /users/:userId — update user's own role
router.patch(
  "/users/:userId",
  authorizationMiddleware,
  verifyUserRoleMiddleware,
  updateUserRole
);

// GET /dashboard-stats/:userId — get user dashboard statistics
router.get(
  "/dashboard-stats/:userId",
  authorizationMiddleware,
  verifyUserRoleMiddleware,
  getUserDashboardStats
);

export default router;
