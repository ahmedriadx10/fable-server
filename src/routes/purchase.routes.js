import { Router } from "express";
import {
  addPurchase,
  getUserPurchases,
} from "../controllers/purchase.controller.js";
import { getAllTransactions } from "../controllers/admin.controller.js";
import { authorizationMiddleware } from "../middleware/auth.middleware.js";
import { verifyAdminRoleMiddleware } from "../middleware/role.middleware.js";

const router = Router();

// POST /book/purchases — add a purchase record
router.post("/book/purchases", authorizationMiddleware, addPurchase);

// GET /purchase/:userId — get purchases for a specific user
router.get("/purchase/:userId", authorizationMiddleware, getUserPurchases);

// GET /purchases/all-transaction — admin: get all transactions
router.get(
  "/purchases/all-transaction",
  authorizationMiddleware,
  verifyAdminRoleMiddleware,
  getAllTransactions
);

export default router;
