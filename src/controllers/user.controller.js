import { ObjectId } from "mongodb";
import { users, bookmarks, purchases } from "../config/db.js";

/**
 * PATCH /users/:userId
 * Update a user's own role (user → writer or writer → user).
 * Admin role cannot be set via this endpoint.
 */
export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent other users from updating another user's role
    if (req?.user?.id !== userId) {
      return res.status(403).json({ message: "Forbidden access" });
    }

    const { role } = req.body;

    // Security guard: block admin or invalid role selection
    if (role === "admin" || !["user", "writer"].includes(role)) {
      return res
        .status(403)
        .json({ message: "Invalid or unauthorized role selection" });
    }

    const query = { _id: new ObjectId(userId) };
    const result = await users.updateOne(query, {
      $set: { role: role },
    });

    if (!result?.acknowledged) {
      return res.status(400).json({ message: "Failed to update role" });
    }

    res.send({ success: true, result });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * GET /dashboard-stats/:userId
 * Get dashboard statistics for a specific user (own stats only).
 */
export const getUserDashboardStats = async (req, res) => {
  const { userId } = req.params;

  // Prevent other users from accessing another user's dashboard stats
  if (req?.user?.id !== userId) {
    return res.status(403).json({ message: "Forbidden access" });
  }

  const [totalBookmarks, totalPurchased, totalAmountPurchased] =
    await Promise.all([
      bookmarks.countDocuments({ userId: userId }),
      purchases.countDocuments({ userId: userId }),
      purchases
        .aggregate([
          { $match: { userId: userId } },
          { $group: { _id: null, totalAmount: { $sum: "$price" } } },
        ])
        .toArray(),
    ]);

  const totalAmount = totalAmountPurchased[0]?.totalAmount || 0;

  res.json({
    totalBookmarks,
    totalPurchased,
    totalAmount,
  });
};
