import { ObjectId } from "mongodb";
import { bookmarks } from "../config/db.js";

/**
 * POST /book/bookmarks
 * Add a bookmark (any authenticated non-admin user).
 */
export const addBookmark = async (req, res) => {
  if (req?.user?.role === "admin") {
    return res.status(403).json({ message: "Forbidden access" });
  }

  const bookmarkData = req.body;
  const result = await bookmarks.insertOne(bookmarkData);

  res.json(result);
};

/**
 * GET /bookmarks/:id
 * Get all bookmarks for a specific user (own bookmarks only).
 */
export const getUserBookmarks = async (req, res) => {
  const { id } = req.params;

  // Prevent other users from accessing another user's bookmarks
  if (req?.user?.id !== id) {
    return res.status(403).json({ message: "Forbidden access" });
  }

  const query = { userId: id };
  const result = await bookmarks.find(query).toArray();

  res.json(result);
};

/**
 * DELETE /bookmarks/:bookId
 * Delete a bookmark by its document ID.
 */
export const deleteBookmark = async (req, res) => {
  const { bookId } = req.params;

  const query = { _id: new ObjectId(bookId) };
  const result = await bookmarks.deleteOne(query);

  res.json(result);
};
