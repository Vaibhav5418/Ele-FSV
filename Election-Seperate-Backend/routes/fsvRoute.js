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
router.get('/jessibuca.js', fsvController.getJessibucaScript); // Serve jessibuca via backend to avoid frontend CDN restrictions
router.post('/aistatus', fsvController.saveAiStatus); // Persist AI status record in aistatus collection
router.get('/aistatus/:deviceId', fsvController.getLatestAiStatus); // Read latest AI status by device

router.post('/create', fsvController.createFsvReport);

router.post('/upload/:id', upload.fields([
    { name: 'vehiclePhoto', maxCount: 1 },
    { name: 'driverPhoto', maxCount: 1 },
    { name: 'fstMemberPhoto', maxCount: 1 },
    { name: 'serviceProviderPhoto', maxCount: 1 },
    { name: 'pilPhoto', maxCount: 1 },
    { name: 'localScreenPhoto', maxCount: 1 },
    { name: 'streamScreenshot', maxCount: 1 }
]), fsvController.uploadFsvPhotos);

// Specific routes MUST come before parameterized routes
router.get('/check-vehicle/:vehicleNo', fsvController.checkVehicleExists);
router.get('/check-camera/:cameraId', fsvController.checkCameraExists);
router.get('/reports/user-installations/filters', fsvController.getFsvFilters);
router.get('/reports/user-installations', fsvController.getUsersInstallationReport); // New Route for Master Users Installation Report
router.get('/dashboard/stats', fsvController.getDashboardStats);
router.get('/dashboard/installers', fsvController.getDashboardInstallers);
router.get('/all/reports', fsvController.getAllFsvReports); // New Route for Dashboard
router.get('/installations/summary', fsvController.getInstallationSummary);
router.get('/installations/details', fsvController.getInstallationDetails);
router.get('/all/installations', fsvController.getAllInstallationsWithImageUrls); // All installation data with image URLs
router.get('/my-installations', fsvController.getUserInstallations); // Route for user's installations
router.get('/audit-logs', fsvController.getAuditLogs); // New Route for Audit Logs (Master only)
router.put('/update/:id', fsvController.updateFsvReport); // New Route for Edit
router.delete('/delete/:id', fsvController.deleteFsvReport); // Delete FSV Installation
router.get('/:id', fsvController.getFsvReport); // This MUST be last among GET routes

module.exports = router;
