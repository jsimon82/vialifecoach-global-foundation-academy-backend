import { Router } from "express";
import { 
  getCertificatePreview,
  getStudentCertificates,
  verifyCertificate,
  getCertificateById,
  shareCertificateOnLinkedIn,
  generateCertificate,
  getCertificateStats,
  searchCertificates,
  revokeCertificate,
  downloadCertificatePdf
} from "../controllers/certificate.controller.js";
import { authenticateToken, requireRoles } from "../middlewares/auth.middleware.js";
import { createRateLimiter } from "../middlewares/rateLimiter.middleware.js";

const router = Router();
const certificateVerificationLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
  message: "Too many certificate verification requests, please slow down."
});

// Public routes
router.get("/certificates/preview", getCertificatePreview);
router.get("/certificates/verify/:certificateCode", certificateVerificationLimiter, verifyCertificate);
router.get("/certificates/student/:studentId", getStudentCertificates);
router.post("/certificates/share/linkedin", certificateVerificationLimiter, shareCertificateOnLinkedIn);

// Admin only routes
router.post("/certificates/create", authenticateToken, requireRoles("admin"), generateCertificate);
router.post("/certificates/generate", authenticateToken, requireRoles("admin"), generateCertificate);
router.get("/certificates/stats", authenticateToken, requireRoles("admin"), getCertificateStats);
router.get("/certificates/search", authenticateToken, requireRoles("admin"), searchCertificates);
router.get("/certificates/:certificateId", certificateVerificationLimiter, getCertificateById);
router.post("/certificates/:certificateId/revoke", authenticateToken, requireRoles("admin"), revokeCertificate);
router.put("/certificates/revoke/:certificateId", authenticateToken, requireRoles("admin"), revokeCertificate);
router.get("/certificates/:certificateId/pdf", authenticateToken, requireRoles("admin"), downloadCertificatePdf);

export default router;
