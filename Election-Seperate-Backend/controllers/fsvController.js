const Vehicle = require('../models/Vehicle');
const Camera = require('../models/camera');
const FsvData = require('../models/FsvData');
const EleFlv = require('../models/election-flv-data');
const EleCamera = require('../models/election-camera');
const AuditLog = require('../models/AuditLog');
const { logAction } = require('../utils/auditLogger');
const electionUser = require('../models/election-user');
const { BlobServiceClient } = require('@azure/storage-blob');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const axios = require('axios');
const AiStatus = require('../models/AiStatus');
const Stream = require('../models/Stream');

// Polyfill for global.crypto if not present (needed for some Azure/UUID operations in older Node)
if (!global.crypto) {
    global.crypto = crypto;
}

// Azure Connection String (Should ideally be in process.env)
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = "fsv-photos"; // Ensure this container exists or create it

const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

// Ensure container exists
const ensureContainerExists = async () => {
    try {
        await containerClient.createIfNotExists({ access: 'blob' });
    } catch (error) {
        console.error("Error creating container:", error.message);
    }
};
ensureContainerExists();

const syncWithThirdPartyAPI = async (vehicleData, userEmail = "installer@vmukti.com") => {
    try {
        if (!vehicleData.ptzCameraSerialNumber) {
            console.log("No camera serial number provided.");
            return;
        }

        const isQRT = (vehicleData.isQrtVehicle || vehicleData.isQRTVehicle || '').toString().toLowerCase() === 'yes';
        const districtValue = (vehicleData.districtName || '') + (isQRT ? '-QRT' : '');
        const assemblyValue = (vehicleData.acName || '') + (isQRT ? '-QRT' : '');

        const payload = {
            deviceId: vehicleData.ptzCameraSerialNumber,
            district: districtValue,
            assembly: assemblyValue,
            location: vehicleData.vehicleNo || "",
            location_Type: vehicleData.typeOfVehicle || "indoor",
            operatorName: vehicleData.driverName || "",
            operatorMobile: vehicleData.driverMobileNo || "",
            userEmail: userEmail,
            source: "Application"
        };

        const apiUrl = `https://electionarcisai.vmukti.com:8083/api/camera/update/${encodeURIComponent(vehicleData.ptzCameraSerialNumber)}`;

        console.log("API URL:", apiUrl);
        console.log("Payload:", payload);

        const response = await axios.put(apiUrl, payload, {
            headers: {
                "Content-Type": "application/json"
            },
            timeout: 30000
        });

        console.log("3rd Party Sync Success:", response.data);

    } catch (error) {
        console.error("Status:", error.response?.status);
        console.error("Response:", error.response?.data);
        console.error("Error:", error.message);
    }
};

const deleteFromThirdPartyAPI = async (ptzCameraSerialNumber, userEmail = "installer@vmukti.com") => {
    try {
        if (!ptzCameraSerialNumber) {
            console.log("No camera serial number provided. Skipping 3rd party delete.");
            return;
        }

        const apiUrl = `https://electionarcisai.vmukti.com:8083/api/camera/delete/${encodeURIComponent(ptzCameraSerialNumber)}?userEmail=${encodeURIComponent(userEmail)}&source=Application`;

        console.log("3rd Party Delete URL:", apiUrl);

        const response = await axios.delete(apiUrl, {
            headers: {
                "Content-Type": "application/json"
            }
        });

        console.log("3rd Party Delete Success:", response.data);

    } catch (error) {
        console.error("3rd Party Delete Status:", error.response?.status);
        console.error("3rd Party Delete Response:", error.response?.data);
        console.error("3rd Party Delete Error:", error.message);
    }
};

const JESSIBUCA_SCRIPT_SOURCES = [
    process.env.JESSICA_SCRIPT_URL,
    'https://cdn.jsdelivr.net/npm/jessibuca@3.3.0/dist/jessibuca.js',
    'https://cdn.jsdelivr.net/npm/jessibuca/dist/jessibuca.js',
    'https://unpkg.com/jessibuca/dist/jessibuca.js'
].filter(Boolean);

let jessibucaScriptCache = null;
let jessibucaScriptFetchedAt = 0;
const JESSIBUCA_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const looksLikeValidJs = (content = '') => {
    const trimmed = String(content).trim();
    if (!trimmed) return false;
    if (trimmed.startsWith('<')) return false; // HTML fallback / blocked page
    const lower = trimmed.toLowerCase();
    if (lower.includes('access denied') || lower.includes('forbidden') || lower.includes('illegal')) return false;
    return (
        trimmed.includes('Jessibuca') ||
        trimmed.includes('window.Jessibuca') ||
        trimmed.includes('function')
    );
};

exports.getJessibucaScript = async (req, res) => {
    try {
        // First priority: serve locally bundled script if present (works without internet/CDN).
        const localScriptPath = process.env.JESSICA_LOCAL_SCRIPT_PATH
            || path.resolve(__dirname, '../public/jessibuca.js');
        if (fs.existsSync(localScriptPath)) {
            const localScript = fs.readFileSync(localScriptPath, 'utf8');
            if (looksLikeValidJs(localScript)) {
                res.set('Content-Type', 'application/javascript; charset=utf-8');
                res.set('Cache-Control', 'public, max-age=3600');
                return res.status(200).send(localScript);
            }
            console.error('Local Jessibuca script exists but content is invalid JS at:', localScriptPath);
        }

        const now = Date.now();
        if (jessibucaScriptCache && now - jessibucaScriptFetchedAt < JESSIBUCA_CACHE_TTL_MS) {
            res.set('Content-Type', 'application/javascript; charset=utf-8');
            res.set('Cache-Control', 'public, max-age=3600');
            return res.status(200).send(jessibucaScriptCache);
        }

        for (const scriptUrl of JESSIBUCA_SCRIPT_SOURCES) {
            try {
                const response = await axios.get(scriptUrl, {
                    timeout: 12000,
                    responseType: 'text',
                    validateStatus: () => true,
                    httpsAgent: new https.Agent({ rejectUnauthorized: false })
                });

                if (response.status !== 200) {
                    console.error('Jessibuca source returned non-200:', scriptUrl, response.status);
                    continue;
                }

                const scriptBody = typeof response.data === 'string' ? response.data : '';
                if (!looksLikeValidJs(scriptBody)) {
                    console.error('Jessibuca source returned invalid JS payload:', scriptUrl);
                    continue;
                }

                jessibucaScriptCache = scriptBody;
                jessibucaScriptFetchedAt = now;

                res.set('Content-Type', 'application/javascript; charset=utf-8');
                res.set('Cache-Control', 'public, max-age=3600');
                return res.status(200).send(scriptBody);
            } catch (err) {
                console.error('Failed to fetch Jessibuca from source:', scriptUrl, err.message);
            }
        }

        return res.status(502).json({
            success: false,
            message: 'Unable to fetch Jessibuca script from configured sources. Place jessibuca.js at Election-Seperate-Backend/public/jessibuca.js'
        });
    } catch (error) {
        console.error('Error serving Jessibuca script:', error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.searchFsvDevice = async (req, res) => {
    try {
        const { deviceId } = req.params;
        console.log(`Searching for FSV Device: ${deviceId}`);

        // Always use Stream collection for streaming URLs
        let flvData = null;
        const streamData = await Stream.findOne({ deviceId: deviceId }).sort({ _id: -1 });
        
        if (streamData) {
            flvData = {
                streamname: streamData.deviceId,
                url2: streamData.mediaUrl,
                servername: streamData['server name']
            };
        }

        if (!flvData) {
            return res.status(404).json({ success: false, message: "Device not found in Stream records" });
        }

        // 3. Search for AI Status
        const aiStatus = await AiStatus.findOne({ camera_id: deviceId }).sort({ timestamp: -1, _id: -1 });

        res.status(200).json({
            success: true,
            fsvData: null,
            streamUrl: flvData || null,
            aiStatus: aiStatus || null
        });

    } catch (error) {
        console.error("Error searching FSV Device:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.saveAiStatus = async (req, res) => {
    try {
        const payload = req.body || {};
        const cameraId = payload.camera_id || payload.deviceId || payload.cameraId;

        if (!cameraId) {
            return res.status(400).json({ success: false, message: "camera_id or deviceId is required" });
        }

        const updatePayload = {
            blur: Boolean(payload.blur),
            blackview: Boolean(payload.blackview ?? payload.blackView),
            brightness: Boolean(payload.brightness),
            camera_angle: Number(payload.camera_angle ?? payload.cameraAngle ?? 0),
            BlackAndWhite: Boolean(payload.BlackAndWhite ?? payload.blackAndWhite),
            overall_status: payload.overall_status || payload.overallStatus || "OK",
            bit_rate_bps: Number(payload.bit_rate_bps ?? payload.bitRateBps ?? 0),
            video_format: payload.video_format || payload.videoFormat || "h264",
            audio_format: payload.audio_format || payload.audioFormat || "aac",
            fps: Number(payload.fps ?? 0),
            stream_details_status: payload.stream_details_status || payload.streamDetailsStatus || "success",
            timestamp: payload.timestamp || payload.analyzedAt || new Date(),
        };

        const record = await AiStatus.findOneAndUpdate(
            { camera_id: cameraId },
            {
                $set: updatePayload,
                $setOnInsert: { camera_id: cameraId }
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        return res.status(200).json({
            success: true,
            message: "AI status upserted",
            data: record
        });
    } catch (error) {
        console.error("Error saving AI status:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.getLatestAiStatus = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const aiStatus = await AiStatus.findOne({ camera_id: deviceId }).sort({ timestamp: -1, _id: -1 });

        if (!aiStatus) {
            return res.status(404).json({ success: false, message: "AI status not found" });
        }

        return res.status(200).json({
            success: true,
            data: aiStatus
        });
    } catch (error) {
        console.error("Error fetching latest AI status:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};


exports.createFsvReport = async (req, res) => {
    try {
        console.log("Received FSV Create Request Body:", JSON.stringify(req.body, null, 2));
        const data = req.body;

        // Strictly use ptzCameraSerialNumber for camera validation
        const ptzCameraId = (data.ptzCameraSerialNumber || '').trim();

        if (!ptzCameraId) {
            return res.status(400).json({ success: false, message: "PTZ Camera Serial Number is required." });
        }

        // Validate presence in Stream collection using ptzCameraSerialNumber
        const streamExists = await Stream.findOne({ deviceId: ptzCameraId });
        if (!streamExists) {
            return res.status(400).json({ 
                success: false, 
                message: "Validation failed: PTZ Camera ID not found in Stream collection." 
            });
        }

        // Validate non-presence in Camera collection using ptzCameraSerialNumber (deviceId field)
        const cameraExists = await Camera.findOne({ deviceId: ptzCameraId });
        if (cameraExists) {
            return res.status(400).json({ 
                success: false, 
                message: "This Camera ID already exists on the Portal. Please contact the Backend Team." 
            });
        }

        // 1. Create Vehicle Report
        console.log("Creating Vehicle Report...");
        const vehicle = await Vehicle.create({
            ...data,
            createdByMobile: data.installerMobile || req.body.mobile || 'Unknown'
            // Ensure dates are parsed if needed, though Mongoose handles ISO strings well
        });
        console.log("Vehicle Report Created:", vehicle._id);

        // Audit Log
        const userMobile = data.installerMobile || req.body.mobile || 'Unknown';
        let loggedUserEmail = "installer@vmukti.com";
        if (userMobile && userMobile !== 'Unknown' && !isNaN(parseInt(userMobile))) {
            const user = await electionUser.findOne({ mobile: parseInt(userMobile) });
            if (user) {
                await logAction(user, 'CREATE', 'Vehicle', vehicle._id.toString(), { vehicleNo: data.vehicleNo, districtName: data.districtName }, req.ip);
                // Build email from user's name (no email field in schema)
                loggedUserEmail = `${user.name.replace(/\s+/g, '.').toLowerCase()}@vmukti.com`;
            }
        }

        // Sync with 3rd party API asynchronously
        syncWithThirdPartyAPI(vehicle, loggedUserEmail);

        res.status(201).json({
            success: true,
            message: "FSV Report Created Successfully",
            data: {
                vehicleId: vehicle._id
            }
        });

    } catch (error) {
        console.error("Error creating FSV Report:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
            stack: error.stack
        });
    }
};

exports.uploadFsvPhotos = async (req, res) => {
    try {
        const { id } = req.params; // Vehicle ID
        const files = req.files; // Multer files

        if (!files || Object.keys(files).length === 0) {
            return res.status(400).json({ success: false, message: "No files uploaded" });
        }

        const vehicle = await Vehicle.findById(id);
        if (!vehicle) {
            return res.status(404).json({ success: false, message: "Vehicle Report not found" });
        }

        const updates = {};

        // Upload each file to Azure
        for (const [fieldName, fileArray] of Object.entries(files)) {
            const file = fileArray[0]; // Assuming single file per field
            const blobName = `${id}/${fieldName}-${uuidv4()}${path.extname(file.originalname)}`;
            const blockBlobClient = containerClient.getBlockBlobClient(blobName);

            await blockBlobClient.uploadData(file.buffer, {
                blobHTTPHeaders: { blobContentType: file.mimetype }
            });

            // Update the corresponding URL field in the database
            // Mapping field names from frontend to DB schema
            if (fieldName === 'vehiclePhoto') updates.vehiclePhotoUrl = blockBlobClient.url;
            if (fieldName === 'driverPhoto') updates.driverPhotoUrl = blockBlobClient.url;
            if (fieldName === 'fstMemberPhoto') updates.fstMemberPhotoUrl = blockBlobClient.url;
            if (fieldName === 'serviceProviderPhoto') updates.serviceProviderPhotoUrl = blockBlobClient.url;
            if (fieldName === 'pilPhoto') updates.pilPhotoUrl = blockBlobClient.url;
            if (fieldName === 'localScreenPhoto') updates.localScreenPhotoUrl = blockBlobClient.url;
            if (fieldName === 'streamScreenshot') updates.streamScreenshotUrl = blockBlobClient.url;
        }

        // Save updates to DB
        const updatedVehicle = await Vehicle.findByIdAndUpdate(id, updates, { new: true });

        // Audit Log
        const userMobile = req.body.mobile || 'Unknown';
        if (userMobile && userMobile !== 'Unknown' && !isNaN(parseInt(userMobile))) {
            const user = await electionUser.findOne({ mobile: parseInt(userMobile) });
            if (user) {
                await logAction(user, 'UPDATE', 'Vehicle', id, { action: 'Photo Upload', fields: Object.keys(updates) }, req.ip);
            }
        }

        res.status(200).json({
            success: true,
            message: "Photos Uploaded Successfully",
            data: updatedVehicle
        });

    } catch (error) {
        console.error("Error uploading photos:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

exports.getFsvReport = async (req, res) => {
    try {
        const { id } = req.params;
        const vehicle = await Vehicle.findById(id);

        if (!vehicle) {
            return res.status(404).json({ success: false, message: "Report not found" });
        }

        res.status(200).json({
            success: true,
            data: vehicle
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const https = require('https');

exports.proxyStream = async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) {
            return res.status(400).send("Missing URL parameter");
        }

        console.log(`Proxying stream: ${url}`);

        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream',
            validateStatus: () => true, // Don't throw on 404/500
            httpsAgent: new https.Agent({
                rejectUnauthorized: false // Ignore SSL errors
            })
        });

        console.log(`Upstream Status: ${response.status}`);
        console.log(`Upstream Content-Type: ${response.headers['content-type']}`);

        if (response.status !== 200) {
            return res.status(response.status).send(`Upstream error: ${response.status}`);
        }

        // Forward headers
        res.set('Content-Type', response.headers['content-type']);
        if (response.headers['content-length']) {
            res.set('Content-Length', response.headers['content-length']);
        }
        // Prevent browser/proxy caching for live stream and keep connection open
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        res.set('Surrogate-Control', 'no-store');
        res.set('Connection', 'keep-alive');
        res.set('X-Accel-Buffering', 'no');

        // Pipe the stream
        response.data.on('error', (streamErr) => {
            console.error("Upstream stream error:", streamErr.message);
            if (!res.headersSent) {
                res.status(502).send("Upstream stream error");
            } else {
                res.end();
            }
        });
        response.data.pipe(res);

    } catch (error) {
        console.error("Proxy Error:", error.message);
        res.status(500).send("Error fetching stream");
    }
};

exports.getSuggestions = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query || query.length < 3) {
            return res.status(200).json({ success: true, suggestions: [] });
        }

        const regex = new RegExp(query, 'i'); // Case-insensitive regex

        // Search Stream collection only
        const streamResults = await Stream.find({ deviceId: regex })
            .select('deviceId')
            .limit(10);

        const suggestions = new Set();
        streamResults.forEach(item => {
            if (item.deviceId) suggestions.add(item.deviceId);
        });

        res.status(200).json({
            success: true,
            suggestions: Array.from(suggestions).sort()
        });

    } catch (error) {
        console.error("Error fetching suggestions:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};


exports.getDashboardStats = async (req, res) => {
    try {
        const { startDate, endDate, installerMobile } = req.query;
        let matchQuery = {};

        // Date Filter
        if (startDate || endDate) {
            matchQuery.createdAt = {};
            if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                matchQuery.createdAt.$lte = end;
            }
        }

        // Installer Filter
        if (installerMobile) {
            matchQuery.createdByMobile = String(installerMobile);
        }

        const [districtAgg, statusAgg, dailyAgg] = await Promise.all([
            // District Counts
            Vehicle.aggregate([
                { $match: matchQuery },
                {
                    $group: {
                        _id: { $toUpper: { $trim: { input: { $ifNull: ["$districtName", "UNKNOWN"] } } } },
                        count: { $sum: 1 }
                    }
                }
            ]),
            // Status Counts
            Vehicle.aggregate([
                { $match: matchQuery },
                {
                    $group: {
                        _id: {
                            $cond: [
                                { $gt: [{ $ifNull: ["$vehiclePhotoUrl", ""] }, ""] },
                                "Installed",
                                "Pending"
                            ]
                        },
                        count: { $sum: 1 }
                    }
                }
            ]),
            // Daily Counts
            Vehicle.aggregate([
                { $match: matchQuery },
                {
                    $group: {
                        _id: { $dateToString: { format: "%m/%d/%Y", date: "$createdAt", timezone: "Asia/Kolkata" } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ])
        ]);

        const districtCounts = {};
        districtAgg.forEach(d => { districtCounts[d._id] = d.count; });

        const statusCounts = { Installed: 0, Pending: 0 };
        statusAgg.forEach(s => { statusCounts[s._id] = s.count; });

        const dailyCounts = {};
        dailyAgg.forEach(d => { dailyCounts[d._id] = d.count; });

        res.status(200).json({
            success: true,
            data: { districtCounts, statusCounts, dailyCounts }
        });
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getDashboardInstallers = async (req, res) => {
    try {
        const uniqueMobiles = await Vehicle.distinct('createdByMobile');
        const numericMobiles = uniqueMobiles.filter(m => m && m !== 'Unknown').map(m => parseInt(m, 10)).filter(m => !isNaN(m));
        
        const users = await electionUser.find({ mobile: { $in: numericMobiles } }).select('mobile name').lean();
        
        const installers = users.map(u => ({ mobile: String(u.mobile), name: u.name }));
        // Sort by name
        installers.sort((a, b) => a.name.localeCompare(b.name));
        
        res.status(200).json({
            success: true,
            data: installers
        });
    } catch (error) {
        console.error("Error fetching dashboard installers:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAllFsvReports = async (req, res) => {
    try {
        const { startDate, endDate, installerMobile, page, limit, isExport } = req.query;

        const pageNum = Math.max(1, parseInt(page) || 1);
        let limitNum = parseInt(limit) || 10;
        
        if (isExport !== 'true') {
            limitNum = Math.min(100, limitNum);
        } else {
            limitNum = limitNum || 999999;
        }
        
        const skip = (pageNum - 1) * limitNum;

        let query = {};
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999); // End of day
                query.createdAt.$lte = end;
            }
        }
        
        if (installerMobile) {
            query.createdByMobile = String(installerMobile);
        }

        const [totalCount, reports] = await Promise.all([
            Vehicle.countDocuments(query),
            Vehicle.find(query)
                .select('-driverPhotoUrl -fstMemberPhotoUrl -serviceProviderPhotoUrl -pilPhotoUrl -localScreenPhotoUrl -streamScreenshotUrl')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean()
        ]);

        // 1. Extract unique installer mobiles
        const userMobiles = [...new Set(reports.map(r => r.createdByMobile).filter(m => m && m !== 'Unknown'))];

        // 2. Lookup names in the election-users collection
        const numericMobiles = userMobiles.map(m => parseInt(m, 10)).filter(m => !isNaN(m));
        const users = await electionUser.find({ mobile: { $in: numericMobiles } })
            .select('mobile name')
            .lean();

        // Create a mapping of mobile -> name
        const userMap = {};
        users.forEach(u => {
            userMap[u.mobile] = u.name;
        });

        // 3. Inject user data into reports
        const enhancedReports = reports.map(r => {
            let installerName = 'Unknown';
            let installerMobile = r.createdByMobile || 'Unknown';

            if (r.createdByMobile && r.createdByMobile !== 'Unknown') {
                const mobileNum = parseInt(r.createdByMobile, 10);
                if (!isNaN(mobileNum) && userMap[mobileNum]) {
                    installerName = userMap[mobileNum];
                }
            }

            return {
                ...r,
                installerName,
                installerMobile
            };
        });

        res.status(200).json({
            success: true,
            count: enhancedReports.length,
            totalCount,
            page: pageNum,
            totalPages: Math.ceil(totalCount / limitNum),
            data: enhancedReports
        });
    } catch (error) {
        console.error("Error fetching all reports:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAllInstallationsWithImageUrls = async (req, res) => {
    try {
        const installations = await Vehicle.find({}).sort({ createdAt: -1 }).lean();

        const data = installations.map((installation) => ({
            ...installation,
            vehiclePhotoUrl: installation.vehiclePhotoUrl || '',
            driverPhotoUrl: installation.driverPhotoUrl || '',
            fstMemberPhotoUrl: installation.fstMemberPhotoUrl || '',
            serviceProviderPhotoUrl: installation.serviceProviderPhotoUrl || '',
            pilPhotoUrl: installation.pilPhotoUrl || '',
            localScreenPhotoUrl: installation.localScreenPhotoUrl || '',
            streamScreenshotUrl: installation.streamScreenshotUrl || ''
        }));

        return res.status(200).json({
            success: true,
            count: data.length,
            data
        });
    } catch (error) {
        console.error("Error fetching all installations with image URLs:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.getUserInstallations = async (req, res) => {
    try {
        const userMobile = req.user ? req.user.mobile : req.query.mobile;

        if (!userMobile) {
            return res.status(400).json({ success: false, message: "Mobile number is required" });
        }

        const {
            page, limit,
            searchQuery, searchType,
            districtFilter, assemblyFilter,
            statusFilter, qrtFilter,
            startDate, endDate, isExport
        } = req.query;

        const pageNum = Math.max(1, parseInt(page) || 1);
        let limitNum = parseInt(limit) || 20;
        if (isExport !== 'true') {
            limitNum = Math.min(100, limitNum); // Cap at 100 for normal viewing
        } else {
            limitNum = limitNum || 999999; // High limit for export if not specified
        }
        const skip = (pageNum - 1) * limitNum;

        // Check if the user is a master user
        const user = await electionUser.findOne({ mobile: parseInt(userMobile) });
        let query = { createdByMobile: String(userMobile) };

        if (user && user.role === 'master') {
            query = {}; // Master user sees all installations
        }

        // Apply Date Filters
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        // Apply filters
        if (districtFilter && districtFilter.trim()) {
            query.districtName = new RegExp(`^\\s*${districtFilter.trim()}\\s*$`, 'i');
        }
        if (assemblyFilter && assemblyFilter.trim()) {
            query.acName = new RegExp(`^\\s*${assemblyFilter.trim()}\\s*$`, 'i');
        }
        if (statusFilter) {
            if (statusFilter === 'Completed') {
                query.vehiclePhotoUrl = { $exists: true, $nin: [null, ''] };
            } else if (statusFilter === 'Pending') {
                query.$and = [{ $or: [{ vehiclePhotoUrl: { $exists: false } }, { vehiclePhotoUrl: null }, { vehiclePhotoUrl: '' }] }];
            }
        }
        if (qrtFilter) {
            if (qrtFilter.toLowerCase() === 'yes') {
                query.isQrtVehicle = 'Yes';
            } else if (qrtFilter.toLowerCase() === 'no') {
                const qrtOr = { $or: [{ isQrtVehicle: { $in: ['No', 'no', ''] } }, { isQrtVehicle: { $exists: false } }, { isQrtVehicle: null }] };
                query.$and = query.$and ? [...query.$and, qrtOr] : [qrtOr];
            }
        }
        if (searchQuery && searchQuery.trim()) {
            const sq = searchQuery.trim();
            if (searchType === 'camera') {
                query.ptzCameraSerialNumber = new RegExp(sq, 'i');
            } else {
                query.vehicleNo = new RegExp(sq, 'i');
            }
        }

        const [totalCount, installations] = await Promise.all([
            Vehicle.countDocuments(query),
            Vehicle.find(query)
                .select('-driverPhotoUrl -fstMemberPhotoUrl -serviceProviderPhotoUrl -pilPhotoUrl -localScreenPhotoUrl -streamScreenshotUrl')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean()
        ]);

        // Lookup installer names for just this page's records
        const userMobiles = [...new Set(installations.map(r => r.createdByMobile).filter(m => m && m !== 'Unknown'))];
        const numericMobiles = userMobiles.map(m => parseInt(m, 10)).filter(m => !isNaN(m));
        const users = await electionUser.find({ mobile: { $in: numericMobiles } }).select('mobile name').lean();
        const userMap = {};
        users.forEach(u => { userMap[u.mobile] = u.name; });

        const enriched = installations.map(r => {
            let installerName = 'Unknown';
            let installerMobile = r.createdByMobile || 'Unknown';
            if (r.createdByMobile && r.createdByMobile !== 'Unknown') {
                const mobileNum = parseInt(r.createdByMobile, 10);
                if (!isNaN(mobileNum) && userMap[mobileNum]) {
                    installerName = userMap[mobileNum];
                }
            }
            return { ...r, installerName, installerMobile };
        });

        res.status(200).json({
            success: true,
            count: enriched.length,
            totalCount,
            page: pageNum,
            totalPages: Math.ceil(totalCount / limitNum),
            data: enriched
        });
    } catch (error) {
        console.error("Error fetching user installations:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateFsvReport = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const oldVehicle = await Vehicle.findById(id);
        const vehicle = await Vehicle.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true
        });

        if (!vehicle) {
            return res.status(404).json({ success: false, message: "Report not found" });
        }

        // Audit Log - track changes
        const userMobile = req.body.mobile || req.query.mobile || 'Unknown';
        let loggedUserEmail = "installer@vmukti.com";
        if (userMobile && userMobile !== 'Unknown' && !isNaN(parseInt(userMobile))) {
            const user = await electionUser.findOne({ mobile: parseInt(userMobile) });
            if (user) {
                const changes = { before: {}, after: {} };
                Object.keys(updates).forEach(key => {
                    if (oldVehicle[key] !== updates[key]) {
                        changes.before[key] = oldVehicle[key];
                        changes.after[key] = updates[key];
                    }
                });
                await logAction(user, 'UPDATE', 'Vehicle', id, changes, req.ip);
                // Build email from user's name (no email field in schema)
                loggedUserEmail = `${user.name.replace(/\s+/g, '.').toLowerCase()}@vmukti.com`;
            }
        }

        // Sync with 3rd party API asynchronously
        syncWithThirdPartyAPI(vehicle, loggedUserEmail);

        res.status(200).json({
            success: true,
            data: vehicle
        });
    } catch (error) {
        console.error("Error updating report:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteFsvReport = async (req, res) => {
    try {
        const { id } = req.params;
        const userMobile = req.query.mobile || 'Unknown';

        const vehicle = await Vehicle.findById(id);
        if (!vehicle) {
            return res.status(404).json({ success: false, message: "Report not found" });
        }

        await Vehicle.findByIdAndDelete(id);

        // Look up logged-in user for email
        let loggedUserEmail = "installer@vmukti.com";
        if (userMobile && userMobile !== 'Unknown' && !isNaN(parseInt(userMobile))) {
            const user = await electionUser.findOne({ mobile: parseInt(userMobile) });
            if (user) {
                loggedUserEmail = `${user.name.replace(/\s+/g, '.').toLowerCase()}@vmukti.com`;
                await logAction(user, 'DELETE', 'Vehicle', id, { vehicleNo: vehicle.vehicleNo, districtName: vehicle.districtName }, req.ip);
            }
        }

        // Sync delete with 3rd party API
        await deleteFromThirdPartyAPI(vehicle.ptzCameraSerialNumber, loggedUserEmail);


        res.status(200).json({
            success: true,
            message: "Installation deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting FSV report:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAuditLogs = async (req, res) => {
    try {
        const { page = 1, limit = 50, action, resourceType, userMobile, startDate, endDate } = req.query;

        const matchQuery = {};
        
        // Only fetch logs that came from the application source
        matchQuery['history.source'] = { $regex: /^application$/i };

        if (action) matchQuery['history.action'] = action;
        if (resourceType) matchQuery['history.resourceType'] = resourceType;
        if (userMobile) matchQuery['history.userMobile'] = userMobile;
        
        if (startDate || endDate) {
            matchQuery['history.timestamp'] = {};
            if (startDate) matchQuery['history.timestamp'].$gte = new Date(startDate);
            if (endDate) matchQuery['history.timestamp'].$lte = new Date(endDate);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const limitNum = parseInt(limit);

        const pipeline = [
            { $unwind: "$history" },
            { $match: matchQuery },
            { $sort: { "history.timestamp": -1 } },
            // Merge vehicleNo into the history object
            { $replaceRoot: { newRoot: { $mergeObjects: ["$history", { vehicleNo: "$vehicleNo" }] } } },
            { $facet: {
                data: [{ $skip: skip }, { $limit: limitNum }],
                totalCount: [{ $count: "count" }]
            }}
        ];

        const VehicleLog = require('../models/VehicleLog');
        const results = await VehicleLog.aggregate(pipeline);
        
        const rawLogs = results[0].data;
        const total = results[0].totalCount.length > 0 ? results[0].totalCount[0].count : 0;

        // Helper: extract name from email or plain name
        // e.g. "vaibhav.soni@vmukti.com" -> "Vaibhav Soni"
        // e.g. "vaibhav.soni" -> "Vaibhav Soni"
        // e.g. "Vaibhav Soni" -> "Vaibhav Soni"
        const formatUserName = (raw) => {
            if (!raw || raw === 'Unknown') return 'Unknown';
            // Strip domain if email
            const namePart = raw.includes('@') ? raw.split('@')[0] : raw;
            // Split by dot or underscore, capitalize each word
            return namePart
                .split(/[._]/)
                .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                .join(' ');
        };

        // Normalise each log entry's field names
        const logs = rawLogs.map(log => {
            // Try all possible field names for each column
            const rawEmail = log.userEmail || log.email || log.userName || log.user || log.name || log.updatedBy || log.editedBy || log.performedBy || log.createdBy || '';
            return {
                ...log,
                timestamp:    log.timestamp    || log.date        || log.createdAt   || null,
                userName:     formatUserName(rawEmail),
                userMobile:   log.userMobile   || log.mobile      || log.phone       || '',
                userRole:     log.userRole     || log.role        || log.userType     || '',
                action:       log.action       || log.actionType  || log.event       || '',
                resourceType: log.resourceType || log.resource    || log.entity      || log.vehicleNo || '',
                changes:      log.changes      || log.details     || log.data        || null,
            };
        });

        res.status(200).json({
            success: true,
            count: logs.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limitNum),
            data: logs
        });
    } catch (error) {
        console.error("Error fetching audit logs:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getFsvFilters = async (req, res) => {
    try {
        const { district } = req.query;

        // Fetch all possible districts from all potential sources to be 100% complete
        const [vDist, cDist, fDist, uDist, uStateDist] = await Promise.all([
            Vehicle.distinct('districtName'),
            Vehicle.distinct('districtName'), // Replaced EleCamera
            Vehicle.distinct('districtName'), // Replaced FsvData
            electionUser.distinct('district'),
            electionUser.distinct('stateAssigned') // Some records use stateAssigned as district
        ]);

        // Merge, trim, filter out empty, and sort
        const districts = [...new Set([...vDist, ...cDist, ...fDist, ...uDist, ...uStateDist])]
            .map(d => (d || '').toString().trim())
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b));

        let assemblies = [];
        if (district) {
            // Trim the search district just in case
            const searchDistrict = district.trim();
            // Fetch assemblies matching the specific district (using regex for flexibility)
            const dRegex = new RegExp(`^${searchDistrict}$`, 'i');

            const [vAcc, cAcc, fAcc, uAcc] = await Promise.all([
                Vehicle.distinct('acName', { districtName: dRegex }),
                Vehicle.distinct('acName', { districtName: dRegex }), // Replaced EleCamera
                Vehicle.distinct('acName', { districtName: dRegex }), // Replaced FsvData
                electionUser.distinct('assemblyName', { district: dRegex })
            ]);
            assemblies = [...new Set([...vAcc, ...cAcc, ...fAcc, ...uAcc])]
                .map(a => (a || '').toString().trim())
                .filter(Boolean)
                .sort((a, b) => a.localeCompare(b));
        } else {
            // Fetch all assemblies from all sources
            const [vAcc, cAcc, fAcc, uAcc] = await Promise.all([
                Vehicle.distinct('acName'),
                Vehicle.distinct('acName'), // Replaced EleCamera
                Vehicle.distinct('acName'), // Replaced FsvData
                electionUser.distinct('assemblyName')
            ]);
            assemblies = [...new Set([...vAcc, ...cAcc, ...fAcc, ...uAcc])]
                .map(a => (a || '').toString().trim())
                .filter(Boolean)
                .sort((a, b) => a.localeCompare(b));
        }

        res.status(200).json({
            success: true,
            districts,
            assemblies
        });
    } catch (error) {
        console.error("Error fetching FSV filters:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Users Installation Report specific to FSV data
exports.getUsersInstallationReport = async (req, res, next) => {
    try {
        const { startDate, endDate, district, assemblyName } = req.query;
        let query = {};
        let cameraQuery = {};

        // Date filtering
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        // District & Assembly filtering
        if (district) {
            const dRegex = new RegExp(`^${district.trim()}$`, 'i');
            query.districtName = dRegex;
            cameraQuery.districtName = dRegex; // Fixed for Vehicle model
        }
        if (assemblyName) {
            const aRegex = new RegExp(`^${assemblyName.trim()}$`, 'i');
            query.acName = aRegex;
            cameraQuery.acName = aRegex; // Fixed for Vehicle model
        }

        const allVehicles = await Vehicle.find(query)
            .select('createdByMobile vehiclePhotoUrl ptzCameraSerialNumber vehicleNo districtName acName driverName driverMobileNo gpsDeviceSerialNo internet4GRouterSimNo installationDate createdAt installationSiteAddress')
            .lean();

        // Fetch all assigned cameras (respecting filters if provided)
        // Replaced EleCamera with Vehicle
        const rawCameras = await Vehicle.find(cameraQuery).lean();
        const allCameras = rawCameras.map(v => ({
            assignedDid: v.createdByMobile,
            personMobile: v.driverMobileNo,
            deviceId: v.ptzCameraSerialNumber,
            district: v.districtName,
            assemblyName: v.acName
        }));

        // Fetch installers (respecting filters)
        let installerQuery = { role: { $nin: ['master', 'admin'] } };
        if (district) installerQuery.district = district;
        if (assemblyName) installerQuery.assemblyName = assemblyName;

        const installers = await electionUser.find(installerQuery)
            .select('mobile name district stateAssigned state role')
            .lean();

        const reportData = [];

        for (const user of installers) {
            // fsV correlations use createdByMobile to attach vehicles securely
            const userVehicles = allVehicles.filter(v => v.createdByMobile == user.mobile);

            // Vehicles with a main photo are interpreted as technically installed
            const completedVehicles = userVehicles.filter(v => !!v.vehiclePhotoUrl);

            // Vehicles created but missing photos
            const incompleteVehicles = userVehicles.filter(v => !v.vehiclePhotoUrl);

            // Fetch ALL cameras assigned to this user from the EleCamera database to get REAL pending cameras 
            // that haven't even been started (no Vehicle record created yet).
            const assignedCameras = allCameras.filter(c => c.assignedDid == user.mobile || c.personMobile == user.mobile);

            // Filter out cameras that are already in the "Completed" list
            // Assuming ptzCameraSerialNumber or gpsDeviceSerialNo matches deviceId
            const completedCameraIds = completedVehicles.map(v => v.ptzCameraSerialNumber);
            const untouchedCameras = assignedCameras.filter(c => !completedCameraIds.includes(c.deviceId));

            const pendingTotal = incompleteVehicles.length + untouchedCameras.length;

            reportData.push({
                user: {
                    name: user.name,
                    mobile: user.mobile,
                    district: user.district || user.stateAssigned || 'N/A',
                    state: user.state || 'N/A'
                },
                installationsCompleted: completedVehicles.length,
                installationsPending: pendingTotal,
                completedDetails: completedVehicles.map(v => ({
                    vehicleNo: v.vehicleNo || 'N/A',
                    district: v.districtName || 'N/A',
                    acName: v.acName || 'N/A',
                    driverName: v.driverName || 'N/A',
                    driverMobile: v.driverMobileNo || 'N/A',
                    ptzCameraId: v.ptzCameraSerialNumber || 'N/A',
                    gpsNo: v.gpsDeviceSerialNo || 'N/A',
                    routerNo: v.internet4GRouterSimNo || 'N/A',
                    installationDate: v.installationDate ? new Date(v.installationDate).toLocaleDateString() : 'N/A',
                    submissionTime: v.createdAt ? new Date(v.createdAt).toLocaleTimeString() : 'N/A',
                    siteAddress: v.installationSiteAddress || 'N/A',
                    status: 'Completed'
                })),
                pendingDetails: [
                    ...incompleteVehicles.map(v => ({
                        ptzCameraId: v.ptzCameraSerialNumber || 'N/A',
                        district: v.districtName || 'N/A',
                        acName: v.acName || 'N/A',
                        status: 'Pending'
                    })),
                    ...untouchedCameras.map(c => ({
                        ptzCameraId: c.deviceId || 'N/A',
                        district: c.district || 'N/A',
                        acName: c.assemblyName || 'N/A',
                        status: 'Pending'
                    }))
                ]
            });
        }

        res.status(200).json({
            success: true,
            data: reportData
        });

    } catch (error) {
        console.error("Error generating user installation report:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

exports.checkVehicleExists = async (req, res) => {
    try {
        const { vehicleNo } = req.params;
        const exists = await Vehicle.exists({ vehicleNo: vehicleNo.toUpperCase().replace(/\s+/g, '') });
        res.status(200).json({ success: true, exists: !!exists });
    } catch (error) {
        console.error("Error checking vehicle exists:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.checkCameraExists = async (req, res) => {
    try {
        const { cameraId } = req.params;
        const vehicles = await Vehicle.find({ ptzCameraSerialNumber: cameraId.trim() }).lean();

        if (vehicles.length > 0) {
            // Check if any is completed (has vehiclePhotoUrl)
            const completedVehicle = vehicles.find(v => !!v.vehiclePhotoUrl);
            if (completedVehicle) {
                return res.status(200).json({ success: true, exists: true, status: 'Completed', data: completedVehicle });
            } else {
                // Return the pending vehicle
                return res.status(200).json({ success: true, exists: true, status: 'Pending', data: vehicles[0] });
            }
        } else {
            res.status(200).json({ success: true, exists: false });
        }
    } catch (error) {
        console.error("Error checking camera exists:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};


// ─── Shared filter builder ───────────────────────────────────────────────────
// All $or clauses are pushed into a top-level $and array so they never
// overwrite each other when multiple filters are active simultaneously.
const buildMatchQuery = async (params) => {
    const {
        mobile, startDate, endDate, statusSearch,
        districtSearch, assemblySearch, qrtSearch, gpsSearch,
        searchQuery, searchType, installerSearch, district
    } = params;

    const user = await electionUser.findOne({ mobile: parseInt(mobile) });
    const and = [];   // collects $or / complex conditions
    const q = {};     // simple field equality / range conditions

    // Role gate – non-master sees only their own records
    if (!user || user.role !== 'master') {
        q.createdByMobile = String(mobile);
    }

    // Date range
    if (startDate || endDate) {
        q.createdAt = {};
        if (startDate) q.createdAt.$gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            q.createdAt.$lte = end;
        }
    }

    // District – prefer the explicit district param (accordion expand), then the search filter
    if (district) {
        q.districtName = new RegExp(`^\\s*${district.trim()}\\s*$`, 'i');
    } else if (districtSearch && districtSearch.trim()) {
        q.districtName = new RegExp(`^\\s*${districtSearch.trim()}\\s*$`, 'i');
    }

    // Assembly
    if (assemblySearch && assemblySearch.trim()) {
        q.acName = new RegExp(`^\\s*${assemblySearch.trim()}\\s*$`, 'i');
    }

    // Vehicle / Camera text search
    if (searchQuery && searchQuery.trim()) {
        const sq = searchQuery.trim();
        if (searchType === 'camera') {
            q.ptzCameraSerialNumber = new RegExp(sq, 'i');
        } else {
            q.vehicleNo = new RegExp(sq, 'i');
        }
    }

    // Status (Completed = has vehiclePhotoUrl, Pending = missing/empty)
    if (statusSearch) {
        if (statusSearch === 'Completed') {
            q.vehiclePhotoUrl = { $exists: true, $nin: [null, ''] };
        } else if (statusSearch === 'Pending') {
            and.push({ $or: [
                { vehiclePhotoUrl: { $exists: false } },
                { vehiclePhotoUrl: null },
                { vehiclePhotoUrl: '' }
            ]});
        }
    }

    // QRT filter
    if (qrtSearch) {
        if (qrtSearch.toLowerCase() === 'yes') {
            q.isQrtVehicle = 'Yes';
        } else if (qrtSearch.toLowerCase() === 'no') {
            and.push({ $or: [
                { isQrtVehicle: { $in: ['No', 'no', 'NO', ''] } },
                { isQrtVehicle: { $exists: false } },
                { isQrtVehicle: null }
            ]});
        }
    }

    // GPS filter – vehicles with NO GPS have the field missing, empty, or set to 'N/A'
    if (gpsSearch) {
        if (gpsSearch.toLowerCase() === 'yes') {
            // Has a real GPS serial: field exists, non-empty, not 'N/A'
            q.gpsDeviceSerialNo = { $exists: true, $nin: [null, '', 'N/A', 'n/a', 'NA'] };
        } else if (gpsSearch.toLowerCase() === 'no') {
            and.push({ $or: [
                { gpsDeviceSerialNo: { $exists: false } },
                { gpsDeviceSerialNo: null },
                { gpsDeviceSerialNo: '' },
                { gpsDeviceSerialNo: { $in: ['N/A', 'n/a', 'NA', 'na'] } }
            ]});
        }
    }

    // Installer search (by name or mobile number)
    if (installerSearch && installerSearch.trim()) {
        const searchNorm = installerSearch.trim();
        const isNum = /^\d+$/.test(searchNorm);
        const installerQ = { role: { $nin: ['master', 'admin'] } };
        if (isNum) {
            installerQ.$or = [{ mobile: parseInt(searchNorm, 10) }, { name: new RegExp(searchNorm, 'i') }];
        } else {
            installerQ.name = new RegExp(searchNorm, 'i');
        }
        const installers = await electionUser.find(installerQ).select('mobile').lean();
        const installerMobiles = installers.map(u => String(u.mobile));
        q.createdByMobile = { $in: installerMobiles };
    }

    // Merge simple conditions and $and conditions
    if (and.length > 0) {
        return { ...q, $and: and };
    }
    return q;
};
// ─────────────────────────────────────────────────────────────────────────────

exports.getInstallationSummary = async (req, res) => {
    try {
        const { mobile, startDate, endDate, statusSearch, districtSearch, assemblySearch, qrtSearch, gpsSearch, searchQuery, searchType, installerSearch } = req.query;

        if (!mobile) {
            return res.status(400).json({ success: false, message: "Mobile number is required" });
        }

        const matchQuery = await buildMatchQuery(req.query);

        const pipeline = [
            { $match: matchQuery },
            {
                $group: {
                    _id: { $toUpper: { $trim: { input: { $ifNull: ["$districtName", "UNKNOWN"] } } } },
                    completed: {
                        $sum: {
                            $cond: [
                                { $gt: [{ $ifNull: ["$vehiclePhotoUrl", ""] }, ""] },
                                1,
                                0
                            ]
                        }
                    },
                    pending: {
                        $sum: {
                            $cond: [
                                { $gt: [{ $ifNull: ["$vehiclePhotoUrl", ""] }, ""] },
                                0,
                                1
                            ]
                        }
                    },
                    assemblies: { $addToSet: "$acName" }
                }
            },
            {
                $project: {
                    district: "$_id",
                    installationsCompleted: "$completed",
                    installationsPending: "$pending",
                    assemblies: 1,
                    _id: 0
                }
            },
            { $sort: { district: 1 } }
        ];

        const summary = await Vehicle.aggregate(pipeline);

        res.status(200).json({ success: true, data: summary });

    } catch (error) {
        console.error("Error fetching summary:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getInstallationDetails = async (req, res) => {
    try {
        const { mobile, startDate, endDate, statusSearch, districtSearch, assemblySearch, qrtSearch, gpsSearch, searchQuery, searchType, installerSearch, district, page, limit } = req.query;

        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 50;
        const skip = (pageNum - 1) * limitNum;

        if (!mobile) {
            return res.status(400).json({ success: false, message: "Mobile number is required" });
        }

        const matchQuery = await buildMatchQuery(req.query);

        const totalCount = await Vehicle.countDocuments(matchQuery);

        let installations = await Vehicle.find(matchQuery)
            .select('-driverPhotoUrl -fstMemberPhotoUrl -serviceProviderPhotoUrl -pilPhotoUrl -localScreenPhotoUrl -streamScreenshotUrl')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean();

        const userMobiles = [...new Set(installations.map(r => r.createdByMobile).filter(m => m && m !== 'Unknown'))];
        const numericMobiles = userMobiles.map(m => parseInt(m, 10)).filter(m => !isNaN(m));
        
        const users = await electionUser.find({ mobile: { $in: numericMobiles } }).select('mobile name').lean();
        const userMap = {};
        users.forEach(u => { userMap[u.mobile] = u.name; });

        installations = installations.map(r => {
            let installerName = 'Unknown';
            if (r.createdByMobile && r.createdByMobile !== 'Unknown') {
                const mobileNum = parseInt(r.createdByMobile, 10);
                if (!isNaN(mobileNum) && userMap[mobileNum]) {
                    installerName = userMap[mobileNum];
                }
            }
            const isCompleted = !!r.vehiclePhotoUrl;
            return {
                vehicleNo: r.vehicleNo || 'N/A',
                district: r.districtName ? r.districtName.trim().toUpperCase() : 'UNKNOWN',
                acName: r.acName || 'N/A',
                driverName: r.driverName || 'N/A',
                driverMobile: r.driverMobileNo || 'N/A',
                ptzCameraId: r.ptzCameraSerialNumber || 'N/A',
                gpsNo: r.gpsDeviceSerialNo || 'N/A',
                routerNo: r.internet4GRouterSimNo || 'N/A',
                isQrtVehicle: r.isQrtVehicle || r.isQRTVehicle || 'No',
                installationDate: r.installationDate ? new Date(r.installationDate).toLocaleDateString() : 'N/A',
                rawDate: r.installationDate || r.createdAt || '',
                submissionTime: r.createdAt ? new Date(r.createdAt).toLocaleTimeString() : 'N/A',
                siteAddress: r.installationSiteAddress || 'N/A',
                status: isCompleted ? 'Completed' : 'Pending',
                installerName,
                installerMobile: r.createdByMobile || 'Unknown'
            };
        });

        res.status(200).json({ success: true, data: installations, totalCount, page: pageNum, limit: limitNum, totalPages: Math.ceil(totalCount / limitNum) });
    } catch (error) {
        console.error("Error fetching details:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
