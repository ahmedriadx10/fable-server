import { purchases } from "../config/db.js";

/**
 * POST /book/purchases
 * Add a purchase record (idempotent — skips if already exists).
 */
export const addPurchase = async (req, res) => {
  const purchaseData = req.body;

  const isAvailablePaymentData = await purchases.findOne({
    userId: purchaseData?.userId,
    bookId: purchaseData?.bookId,
  });

  if (isAvailablePaymentData) {
    return res.json({
      success: true,
      message: "Purchase history already added",
    });
  }

  const result = await purchases.insertOne({
    ...purchaseData,
    createdAt: new Date(),
  });

  res.json(result);
};

/**
 * GET /purchase/:userId
 * Get all purchases for a specific user (own purchases only).
 */
export const getUserPurchases = async (req, res) => {
  const { userId } = req.params;

  // Prevent other users from accessing another user's purchase data
  if (req?.user?.id !== userId) {
    return res.status(403).json({ message: "Forbidden access" });
  }

  const query = { userId: userId };
  const cursor = purchases.find(query).sort({ createdAt: -1 });
  const result = await cursor.toArray();

  res.json(result);
};
