import { Router } from "express";
import {
  createBook,
  getWriterBooks,
  getWriterProfile,
  updateBook,
  deleteBook,
  getPublicBooks,
  getHomeData,
  getGenres,
  getBookDetails,
} from "../controllers/book.controller.js";
import {
  authorizationMiddleware,
  checkUserMiddleware,
} from "../middleware/auth.middleware.js";
import { verifyWriterRoleMiddleware } from "../middleware/role.middleware.js";

const router = Router();

// Public routes
router.get("/home", getHomeData);
router.get("/books/genres", getGenres);
router.get("/books", getPublicBooks);
router.get("/books/:bookId", checkUserMiddleware, getBookDetails);

// Public writer profile
router.get("/writer/:writerId", getWriterProfile);

// Writer-protected routes
router.post("/books", authorizationMiddleware, verifyWriterRoleMiddleware, createBook);
router.get("/writer/books/:writerId", authorizationMiddleware, verifyWriterRoleMiddleware, getWriterBooks);
router.patch("/books/:bookId", authorizationMiddleware, verifyWriterRoleMiddleware, updateBook);
router.delete("/books/:bookId", authorizationMiddleware, verifyWriterRoleMiddleware, deleteBook);

export default router;
