import { ObjectId } from "mongodb";
import { users, books, purchases, bookmarks } from "../config/db.js";

/**
 * POST /books
 * Create a new book (writer only).
 */
export const createBook = async (req, res) => {
  const bookData = req.body;

  const result = await books.insertOne({
    ...bookData,
    createdAt: new Date(),
  });

  res.json(result);
};

/**
 * GET /writer/books/:writerId
 * Get all books belonging to a specific writer (writer only, own books).
 */
export const getWriterBooks = async (req, res) => {
  const { writerId } = req.params;

  // Prevent other writers from accessing another writer's books
  if (req?.user?.id !== writerId) {
    return res.status(403).json({ message: "Forbidden access" });
  }

  const cursor = books.find({ authorId: writerId });
  const result = await cursor.toArray();

  res.json(result);
};

/**
 * GET /writer/:writerId
 * Public — get a writer's profile, published ebooks, and total books count.
 */
export const getWriterProfile = async (req, res) => {
  const { writerId } = req.params;

  const [writerData, writerEbooks, writerTotalBooks] = await Promise.all([
    users.findOne(
      { _id: new ObjectId(writerId) },
      {
        projection: {
          name: 1,
          image: 1,
          email: 1,
        },
      }
    ),
    books
      .find(
        { authorId: writerId, status: "published" },
        {
          projection: {
            _id: 1,
            title: 1,
            coverImage: 1,
            genre: 1,
            authorId: 1,
            summary: 1,
            authorName: 1,
          },
        }
      )
      .toArray(),
    books
      .aggregate([
        { $match: { authorId: writerId, status: "published" } },
        { $group: { _id: null, totalPublished: { $sum: 1 } } },
        { $project: { _id: 0, totalPublished: 1 } },
      ])
      .toArray(),
  ]);

  res.json({
    writerData,
    writerEbooks,
    writerTotalBooks,
  });
};

/**
 * PATCH /books/:bookId
 * Update a book's data (writer only).
 */
export const updateBook = async (req, res) => {
  const { bookId } = req.params;
  const updateData = req.body;

  const query = { _id: new ObjectId(bookId) };

  const result = await books.updateOne(query, {
    $set: { ...updateData },
  });

  res.json(result);
};

/**
 * DELETE /books/:bookId
 * Delete a book (writer only).
 */
export const deleteBook = async (req, res) => {
  const { bookId } = req.params;

  const query = { _id: new ObjectId(bookId) };
  const result = await books.deleteOne(query);

  res.json(result);
};

/**
 * GET /books
 * Public — get paginated published books with optional search, filter, and sort.
 */
export const getPublicBooks = async (req, res) => {
  const query = { status: "published" };
  const sortQuery = {};
  const searchParams = req.query;

  if (searchParams?.search) {
    query.$or = [
      { title: { $regex: searchParams.search, $options: "i" } },
      { authorName: { $regex: searchParams.search, $options: "i" } },
    ];
  }

  if (searchParams?.minPrice) {
    query.price = {};
    query.price.$gte = parseFloat(searchParams.minPrice);
  }

  if (searchParams?.maxPrice) {
    if (!query.price) query.price = {};
    query.price.$lte = parseFloat(searchParams.maxPrice);
  }

  if (searchParams?.genre) {
    query.genre = { $regex: searchParams.genre, $options: "i" };
  }

  if (searchParams?.sortBy) {
    if (searchParams.sortBy === "Nf") sortQuery.createdAt = -1;
    if (searchParams.sortBy === "Lth") sortQuery.price = 1;
    if (searchParams.sortBy === "Htl") sortQuery.price = -1;
  }

  const page = Math.max(parseInt(searchParams?.page) || 1, 1);
  const perPage = 8;
  const skip = (page - 1) * perPage;

  const [totalBooksCount, booksData] = await Promise.all([
    books.countDocuments(query),
    books.find(query).sort(sortQuery).skip(skip).limit(perPage).toArray(),
  ]);

  res.json({
    totalBooks: totalBooksCount,
    books: booksData,
  });
};

/**
 * GET /home
 * Public — get featured books, top writers, and available genres for the homepage.
 */
export const getHomeData = async (req, res) => {
  const [featuredBooks, topWriters, availableGenres] = await Promise.all([
    books.find({ status: "published" }).sort({ createdAt: -1 }).limit(6).toArray(),
    purchases
      .aggregate([
        {
          $group: {
            _id: "$authorId",
            authorName: { $first: "$authorName" },
            totalSales: { $sum: 1 },
            totalRevenue: { $sum: "$price" },
          },
        },
        { $sort: { totalSales: -1 } },
        { $limit: 3 },
        { $addFields: { authorObjectId: { $toObjectId: "$_id" } } },
        {
          $lookup: {
            from: "user",
            localField: "authorObjectId",
            foreignField: "_id",
            as: "writer",
          },
        },
        { $unwind: "$writer" },
        {
          $lookup: {
            from: "books",
            localField: "_id",
            foreignField: "authorId",
            as: "books",
          },
        },
        {
          $project: {
            _id: 0,
            writerName: "$authorName",
            writerImage: "$writer.image",
            totalBooks: { $size: "$books" },
            totalSales: 1,
            totalRevenue: 1,
          },
        },
      ])
      .toArray(),
    books
      .aggregate([
        { $group: { _id: "$genre" } },
        { $project: { _id: 0, genre: "$_id" } },
        { $limit: 5 },
      ])
      .toArray(),
  ]);

  res.json({ featuredBooks, topWriters, availableGenres });
};

/**
 * GET /books/genres
 * Public — get all unique book genres.
 */
export const getGenres = async (req, res) => {
  const cursor = books.aggregate([
    { $group: { _id: "$genre" } },
    { $project: { _id: 0, genre: "$_id" } },
  ]);

  const result = await cursor.toArray();
  res.json(result);
};

/**
 * GET /books/:bookId
 * Public (with optional auth) — get full book details.
 * Returns content only if the user has access (purchased or is the author).
 */
export const getBookDetails = async (req, res) => {
  const { bookId } = req.params;

  const query = { _id: new ObjectId(bookId) };
  const result = await books.findOne(query);

  if (!result) {
    return res.status(404).json({ success: false, message: "Ebook not found" });
  }

  const user = req?.user;
  const { content, ...mainEbookData } = result;

  let purchased = false;
  let bookmarked = false;
  let hasAccess = false;
  let isWriter = false;

  if (user) {
    if (user?.id === result?.authorId) {
      isWriter = true;
      hasAccess = true;
    } else {
      const isAvailablePurchase = await purchases.findOne({
        userId: user?.id,
        bookId: bookId,
      });

      if (isAvailablePurchase) {
        purchased = true;
        hasAccess = true;
      }

      const isAvailableBookmark = await bookmarks.findOne({
        userId: user?.id,
        bookId: bookId,
      });

      if (isAvailableBookmark) {
        bookmarked = true;
      }
    }
  }

  const finalResponseData = {
    ...mainEbookData,
    ...(hasAccess && { content }),
    purchased,
    bookmarked,
    hasAccess,
    isWriter,
  };

  res.json({ success: true, data: finalResponseData });
};
