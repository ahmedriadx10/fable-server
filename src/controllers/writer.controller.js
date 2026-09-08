import { books, purchases, bookmarks } from "../config/db.js";

/**
 * GET /dashboard-writer-stats/:writerId
 * Get dashboard stats for a writer (own stats only).
 */
export const getWriterDashboardStats = async (req, res) => {
  const { writerId } = req.params;

  // Prevent other writers from accessing another writer's stats
  if (req?.user?.id !== writerId) {
    return res.status(403).json({ message: "Forbidden access" });
  }

  const [totalPublished, totalBookmarked, totalSaleAmount] = await Promise.all([
    books.countDocuments({ authorId: writerId }),
    bookmarks.countDocuments({ userId: writerId }),
    purchases
      .aggregate([
        { $match: { authorId: writerId } },
        { $group: { _id: null, totalSale: { $sum: "$price" } } },
      ])
      .toArray(),
  ]);

  const totalAmount = totalSaleAmount[0]?.totalSale || 0;

  res.json({
    totalPublished,
    totalBookmarked,
    totalAmount,
  });
};

/**
 * GET /sales-history/:writerId
 * Get sales history for a writer (own sales only).
 */
export const getWriterSalesHistory = async (req, res) => {
  const { writerId } = req.params;

  // Prevent other writers from accessing another writer's sales history
  if (req?.user?.id !== writerId) {
    return res.status(403).json({ message: "Forbidden access" });
  }

  const query = { authorId: writerId };
  const cursor = purchases.find(query).sort({ createdAt: -1 });
  const result = await cursor.toArray();

  res.json(result);
};
