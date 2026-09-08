import "dotenv/config";
import { jwtVerify, createRemoteJWKSet } from "jose";

const JWKS = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
);

/**
 * authorizationMiddleware
 * Requires a valid Bearer JWT in the Authorization header.
 * Attaches the decoded payload to req.user.
 */
export const authorizationMiddleware = async (req, res, next) => {
  const authorization = req?.headers?.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized access" });
  }

  const token = authorization.split(" ")[1];

  if (!token || token === "undefined") {
    return res.status(401).json({ message: "Unauthorized access" });
  }

  try {
    const { payload } = await jwtVerify(token, JWKS);
    req.user = payload;
    next();
    return;
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized access" });
  }
};

/**
 * checkUserMiddleware
 * Optional auth — attaches decoded payload to req.user if a valid token is
 * present, otherwise sets req.user = null and continues.
 */
export const checkUserMiddleware = async (req, res, next) => {
  const authorization = req?.headers?.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    req.user = null;
    return next();
  }

  const token = authorization.split(" ")[1];

  try {
    const { payload } = await jwtVerify(token, JWKS);
    req.user = payload;
    return next();
  } catch (error) {
    req.user = null;
    return next();
  }
};
