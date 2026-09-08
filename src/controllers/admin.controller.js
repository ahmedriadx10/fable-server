import { ObjectId } from "mongodb";
import { users, books, purchases, bookmarks } from "../config/db.js";

/**
 * GET /ebooks
 * Admin — get all ebooks sorted by creation date.
 */
export const getAllEbooks = async (req, res) => {
  const cursor = books.find().sort({ createdAt: -1 });
  const result = await cursor.toArray();

  res.json(result);
};

/**
 * DELETE /ebooks/:bookId
 * Admin — delete an ebook by its ID.
 */
export const deleteEbook = async (req, res) => {
  const { bookId } = req.params;
  const query = { _id: new ObjectId(bookId) };

  const result = await books.deleteOne(query);
  res.json(result);
};

/**
 * PATCH /ebooks/:bookId
 * Admin — update ebook data (e.g. status).
 */
export const updateEbookStatus = async (req, res) => {
  const { bookId } = req.params;
  const query = { _id: new ObjectId(bookId) };

  const updatedData = req.body;
  const result = await books.updateOne(query, {
    $set: { ...updatedData },
  });

  res.json(result);
};

/**
 * GET /purchases/all-transaction
 * Admin — get all purchase/transaction records sorted by date.
 */
export const getAllTransactions = async (req, res) => {
  const cursor = purchases.find().sort({ createdAt: -1 });
  const result = await cursor.toArray();

  res.json(result);
};

/**
 * GET /analytics/dashboard-admin
 * Admin — get full dashboard analytics: users, writers, sales, genres.
 */
export const getDashboardAnalytics = async (req, res) => {
  try {
    // Date range setup (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalWriters,
      totalEbookSold,
      totalRevenue,
      salesAggregation,
      genreAggregation,
    ] = await Promise.all([
      users.countDocuments(),
      users.countDocuments({ role: "writer" }),
      purchases.countDocuments({ costType: "payment" }),
      purchases
        .aggregate([
          { $group: { _id: null, totalSale: { $sum: "$price" } } },
        ])
        .toArray(),

      // Monthly sales aggregation (last 6 months)
      purchases
        .aggregate([
          {
            $match: {
              createdAt: { $gte: sixMonthsAgo },
              costType: "payment",
            },
          },
          {
            $group: {
              _id: {
                year: { $year: "$createdAt" },
                month: { $month: "$createdAt" },
              },
              totalSales: { $sum: "$price" },
            },
          },
          { $sort: { "_id.year": 1, "_id.month": 1 } },
        ])
        .toArray(),

      // Genre distribution aggregation
      books
        .aggregate([
          { $group: { _id: "$genre", count: { $sum: 1 } } },
          {
            $group: {
              _id: null,
              totalBooks: { $sum: "$count" },
              genres: { $push: { genre: "$_id", count: "$count" } },
            },
          },
          { $unwind: "$genres" },
          {
            $project: {
              _id: 0,
              genre: "$genres.genre",
              value: "$genres.count",
              percentage: {
                $round: [
                  {
                    $multiply: [
                      { $divide: ["$genres.count", "$totalBooks"] },
                      100,
                    ],
                  },
                  0,
                ],
              },
            },
          },
          { $sort: { percentage: -1 } },
        ])
        .toArray(),
    ]);

    // Fill in zero-sales months
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    const monthlySales = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);

      const currentYear = d.getFullYear();
      const currentMonthNum = d.getMonth() + 1;
      const currentMonthName = monthNames[d.getMonth()];

      const foundMonth = salesAggregation.find(
        (item) =>
          item._id.year === currentYear && item._id.month === currentMonthNum
      );

      monthlySales.push({
        month: currentMonthName,
        sales: foundMonth ? parseFloat(foundMonth.totalSales.toFixed()) : 0,
      });
    }

    const totalSaleAmount = totalRevenue[0]?.totalSale || 0;

    res.json({
      success: true,
      totalUsers,
      totalWriters,
      totalEbookSold,
      totalSaleAmount,
      monthlySales,
      popularGenres: genreAggregation,
    });
  } catch (error) {
    console.error("Dashboard Analytics Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
