import { Router } from "express";
import {
  getWriterDashboardStats,
  getWriterSalesHistory,
} from "../controllers/writer.controller.js";
import { authorizationMiddleware } from "../middleware/auth.middleware.js";
import { verifyWriterRoleMiddleware } from "../middleware/role.middleware.js";

const router = Router();

// GET /dashboard-writer-stats/:writerId — get writer dashboard statistics
router.get(
  "/dashboard-writer-stats/:writerId",
  authorizationMiddleware,
  verifyWriterRoleMiddleware,
  getWriterDashboardStats
);

// GET /sales-history/:writerId — get writer sales history
router.get(
  "/sales-history/:writerId",
  authorizationMiddleware,
  verifyWriterRoleMiddleware,
  getWriterSalesHistory
);

export default router;
