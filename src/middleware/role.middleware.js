/**
 * verifyUserRoleMiddleware
 * Allows only users with role === "user" to proceed.
 */
export const verifyUserRoleMiddleware = (req, res, next) => {
  if (req?.user?.role !== "user") {
    return res.status(403).json({ message: "Forbidden access" });
  }
  next();
};

/**
 * verifyWriterRoleMiddleware
 * Allows only users with role === "writer" to proceed.
 */
export const verifyWriterRoleMiddleware = (req, res, next) => {
  if (req?.user?.role !== "writer") {
    return res.status(403).json({ message: "Forbidden access" });
  }
  next();
};

/**
 * verifyAdminRoleMiddleware
 * Allows only users with role === "admin" to proceed.
 */
export const verifyAdminRoleMiddleware = (req, res, next) => {
  if (req?.user?.role !== "admin") {
    return res.status(403).json({ message: "Forbidden access" });
  }
  next();
};
