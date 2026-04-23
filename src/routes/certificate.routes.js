import { Router } from "express";
import { 
  getCertificatePreview,
  getStudentCertificates,
  verifyCertificate,
  generateCertificate,
  getCertificateStats,
  searchCertificates,
  revokeCertificate,
  downloadCertificatePdf
} from "../controllers/certificate.controller.js";
import { authenticateToken, requireRoles } from "../middlewares/auth.middleware.js";

const router = Router();

// Public routes
router.get("/certificates/preview", getCertificatePreview);
router.get("/certificates/verify/:certificateCode", verifyCertificate);
router.get("/certificates/student/:studentId", getStudentCertificates);

// Admin only routes
router.post("/certificates/generate", authenticateToken, requireRoles("admin"), generateCertificate);
router.get("/certificates/stats", authenticateToken, requireRoles("admin"), getCertificateStats);
router.get("/certificates/search", authenticateToken, requireRoles("admin"), searchCertificates);
router.post("/certificates/:certificateId/revoke", authenticateToken, requireRoles("admin"), revokeCertificate);
router.get("/certificates/:certificateId/pdf", authenticateToken, requireRoles("admin"), downloadCertificatePdf);

export default router;
