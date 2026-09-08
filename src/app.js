import express from "express";
import cors from "cors";

import emailRoutes from "./routes/email.routes.js";
import bookRoutes from "./routes/book.routes.js";
import bookmarkRoutes from "./routes/bookmark.routes.js";
import purchaseRoutes from "./routes/purchase.routes.js";
import userRoutes from "./routes/user.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import writerRoutes from "./routes/writer.routes.js";

const app = express();

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/", emailRoutes);
app.use("/", bookRoutes);
app.use("/", bookmarkRoutes);
app.use("/", purchaseRoutes);
app.use("/", userRoutes);
app.use("/", adminRoutes);
app.use("/", writerRoutes);

export default app;
