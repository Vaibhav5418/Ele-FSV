const express = require('express');
const router = express.Router();
const multer = require('multer');
const fsvController = require('../controllers/fsvController');

// Configure Multer to store files in memory for direct upload to Azure
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get('/search/:deviceId', fsvController.searchFsvDevice);
router.get('/suggestions', fsvController.getSuggestions); // New Suggestions Route
router.get('/proxy/stream', fsvController.proxyStream); // New Proxy Route

router.post('/create', fsvController.createFsvReport);

router.post('/upload/:id', upload.fields([
    { name: 'vehiclePhoto', maxCount: 1 },
    { name: 'driverPhoto', maxCount: 1 },
    { name: 'fstMemberPhoto', maxCount: 1 },
    { name: 'serviceProviderPhoto', maxCount: 1 },
    { name: 'pilPhoto', maxCount: 1 }
]), fsvController.uploadFsvPhotos);

// Specific routes MUST come before parameterized routes
router.get('/all/reports', fsvController.getAllFsvReports); // New Route for Dashboard
router.get('/audit-logs', fsvController.getAuditLogs); // New Route for Audit Logs (Master only)
router.put('/update/:id', fsvController.updateFsvReport); // New Route for Edit
router.get('/:id', fsvController.getFsvReport); // This MUST be last among GET routes

module.exports = router;
