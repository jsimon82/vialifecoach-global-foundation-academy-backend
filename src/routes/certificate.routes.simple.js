const { Router } = require("express");
const { getCertificatePreview } = require("../controllers/certificate.controller.simple.js");

const router = Router();

// Public routes
router.get("/certificates/preview", getCertificatePreview);

module.exports = router;
