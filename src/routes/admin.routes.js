import { Router } from "express";
import {
  getAllEbooks,
  deleteEbook,
  updateEbookStatus,
  getDashboardAnalytics,
} from "../controllers/admin.controller.js";
import { authorizationMiddleware } from "../middleware/auth.middleware.js";
import { verifyAdminRoleMiddleware } from "../middleware/role.middleware.js";

const router = Router();

// GET /ebooks — get all ebooks
router.get(
  "/ebooks",
  authorizationMiddleware,
  verifyAdminRoleMiddleware,
  getAllEbooks
);

// DELETE /ebooks/:bookId — delete an ebook
router.delete(
  "/ebooks/:bookId",
  authorizationMiddleware,
  verifyAdminRoleMiddleware,
  deleteEbook
);

// PATCH /ebooks/:bookId — update ebook data (e.g. status)
router.patch(
  "/ebooks/:bookId",
  authorizationMiddleware,
  verifyAdminRoleMiddleware,
  updateEbookStatus
);

// GET /analytics/dashboard-admin — get full admin dashboard analytics
router.get(
  "/analytics/dashboard-admin",
  authorizationMiddleware,
  verifyAdminRoleMiddleware,
  getDashboardAnalytics
);

export default router;
