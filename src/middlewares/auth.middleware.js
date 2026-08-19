import '../config/env.js';
import { findUserByEmail } from "../models/User.model.js";
import { findCoordinatorByEmail } from "../models/Coordinator.model.js";
import jwt from "jsonwebtoken";
import { getAdminCredentials } from "../utils/adminCredentials.js";

// Get encoded admin email
const HARDCODED_ADMIN_EMAIL = getAdminCredentials().email;

export function normalizeRole(role) {
  if (!role) return role;
  if (role === "lecturer") return "instructor";
  return role;
}

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access token required" });

  try {
    const secret = process.env.ACCESS_TOKEN_SECRET;
    const payload = jwt.verify(token, secret);

    // ======= HARDCODED ADMIN BYPASS =======
    if (payload.email === HARDCODED_ADMIN_EMAIL) {
      req.user = {
        id: 0,
        email: HARDCODED_ADMIN_EMAIL,
        name: "Admin",
        role: "admin",
        verified: true,
      };
      return next();
    }
    // ======= END HARDCODED ADMIN BYPASS =======

    // Check if it's a coordinator token
    if (payload.role === 'coordinator') {
      const coordinator = await findCoordinatorByEmail(payload.email);
      if (!coordinator || coordinator.is_active === false) {
        return res.status(401).json({ message: "Coordinator not found for this token" });
      }
      const coordinatorName = [coordinator.first_name, coordinator.last_name]
        .filter(Boolean)
        .join(" ")
        .trim() || coordinator.name || coordinator.email;

      req.user = {
        id: coordinator.id,
        email: coordinator.email,
        name: coordinatorName,
        role: 'coordinator',
        verified: true,
      };
      return next();
    }

    // Check if it's a regular user token
    const user = await findUserByEmail(payload.email);
    if (!user) return res.status(401).json({ message: "User not found for this token" });

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: normalizeRole(user.role),
      verified: user.verified,
    };
    next();
  } catch (err) {
    return res.status(403).json({ message: "Token expired or invalid" });
  }
}

export async function optionalAuthenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return next();
  }

  try {
    const secret = process.env.ACCESS_TOKEN_SECRET;
    const payload = jwt.verify(token, secret);

    // ======= HARDCODED ADMIN BYPASS =======
    if (payload.email === HARDCODED_ADMIN_EMAIL) {
      req.user = {
        id: 0,
        email: HARDCODED_ADMIN_EMAIL,
        name: "Admin",
        role: "admin",
        verified: true,
      };
      return next();
    }
    // ======= END HARDCODED ADMIN BYPASS =======

    if (payload.role === 'coordinator') {
      const coordinator = await findCoordinatorByEmail(payload.email);
      if (coordinator && coordinator.is_active !== false) {
        const coordinatorName = [coordinator.first_name, coordinator.last_name]
          .filter(Boolean)
          .join(" ")
          .trim() || coordinator.name || coordinator.email;

        req.user = {
          id: coordinator.id,
          email: coordinator.email,
          name: coordinatorName,
          role: 'coordinator',
          verified: true,
        };
      }
      return next();
    }

    const user = await findUserByEmail(payload.email);
    if (!user) return res.status(401).json({ message: "User not found for this token" });

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: normalizeRole(user.role),
      verified: user.verified,
    };
    next();
  } catch (err) {
    return res.status(403).json({ message: "Token expired or invalid" });
  }
}

export function requireRoles(...allowedRoles) {
  const normalizedRoles = allowedRoles.map(normalizeRole);

  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Authentication required" });
    if (!normalizedRoles.includes(normalizeRole(req.user.role))) {
      return res.status(403).json({ message: "You do not have permission to access this resource" });
    }
    next();
  };
}
