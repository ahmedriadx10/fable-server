import { Router } from "express";
import {
  addBookmark,
  getUserBookmarks,
  deleteBookmark,
} from "../controllers/bookmark.controller.js";
import { authorizationMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// POST /book/bookmarks — add a bookmark
router.post("/book/bookmarks", authorizationMiddleware, addBookmark);

// GET /bookmarks/:id — get bookmarks for a user
router.get("/bookmarks/:id", authorizationMiddleware, getUserBookmarks);

// DELETE /bookmarks/:bookId — delete a bookmark
router.delete("/bookmarks/:bookId", authorizationMiddleware, deleteBookmark);

export default router;
